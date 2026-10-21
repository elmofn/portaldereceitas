#!/usr/bin/env python3
"""Coleta limitada para revisão, sem atualizar o catálogo ou baixar fotografias."""
import argparse
import hashlib
import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib import error, parse, request, robotparser

AGENT = 'CarinhoNoPote/1.0'
HOSTS = {'www.tudogostoso.com.br', 'tudogostoso.com.br'}
BASE = 'https://www.tudogostoso.com.br/'
MAX_BYTES = 3_000_000


def trusted_url(value, base=BASE):
    result = parse.urlsplit(parse.urljoin(base, value))
    if result.scheme != 'https' or result.hostname not in HOSTS or result.username or result.password or result.port not in (None, 443):
        raise ValueError('URL externa ou não permitida para coleta')
    return parse.urlunsplit((result.scheme, result.netloc, result.path or '/', '', ''))


class SafeRedirect(request.HTTPRedirectHandler):
    def __init__(self, check=None):
        super().__init__()
        self.check = check

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        target = trusted_url(newurl, req.full_url)
        if self.check:
            self.check(target)
        return super().redirect_request(req, fp, code, msg, headers, target)


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.blocks = [], []
        self.capture = False
        self.buffer = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])
        if tag == 'script' and attrs.get('type', '').lower() == 'application/ld+json':
            self.capture, self.buffer = True, []

    def handle_data(self, data):
        if self.capture:
            self.buffer.append(data)

    def handle_endtag(self, tag):
        if tag == 'script' and self.capture:
            self.blocks.append(''.join(self.buffer))
            self.capture = False


def recipes_from_html(body):
    parser = PageParser()
    parser.feed(body)
    found = []

    def walk(value):
        if isinstance(value, list):
            for child in value:
                walk(child)
        elif isinstance(value, dict):
            types = value.get('@type', [])
            if isinstance(types, str):
                types = [types]
            if 'Recipe' in types:
                found.append(value)
            for key, child in value.items():
                if key != '@context' and isinstance(child, (list, dict)):
                    walk(child)

    for block in parser.blocks:
        try:
            walk(json.loads(block))
        except json.JSONDecodeError:
            continue
    return found


def instructions(value):
    if isinstance(value, str):
        return [html.unescape(re.sub('<[^>]+>', '', value)).strip()]
    if isinstance(value, list):
        return [part for item in value for part in instructions(item)]
    if isinstance(value, dict):
        if value.get('@type') == 'HowToSection':
            return instructions(value.get('itemListElement', []))
        return instructions(value.get('text', ''))
    return []


def as_text(value):
    return html.unescape(re.sub('<[^>]+>', '', str(value))).strip()


def candidate(recipe, url, body):
    ingredients = recipe.get('recipeIngredient', [])
    if not isinstance(ingredients, list) or not ingredients or not all(isinstance(item, str) and item.strip() for item in ingredients):
        raise ValueError('Receita sem lista válida de ingredientes')
    steps = [step for step in instructions(recipe.get('recipeInstructions')) if step]
    if not recipe.get('name') or not steps:
        raise ValueError('Receita sem título ou preparo')
    author = recipe.get('author')
    authors = author if isinstance(author, list) else [author]
    authors = [as_text(item.get('name', '') if isinstance(item, dict) else item or '') for item in authors]
    authors = [name for name in authors if name]
    if not authors:
        raise ValueError('Receita sem autoria identificada')
    image = recipe.get('image')
    image = image[0] if isinstance(image, list) and image else image
    image = image.get('url') or image.get('contentUrl') if isinstance(image, dict) else image
    if not isinstance(image, str) or parse.urlsplit(image).scheme != 'https':
        raise ValueError('Receita sem endereço HTTPS de foto')
    # An image URL is metadata, not authorization to download, hotlink or publish it.
    return {
        'id': hashlib.sha256(url.encode()).hexdigest()[:16],
        'source': {'publisher': 'TudoGostoso', 'url': trusted_url(url), 'authors': authors,
                   'retrievedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                   'pageSha256': hashlib.sha256(body.encode()).hexdigest()},
        'title': as_text(recipe['name']), 'ingredients': [as_text(item) for item in ingredients],
        'hasInstructions': bool(steps), 'yieldOriginal': recipe.get('recipeYield'),
        'totalTimeOriginal': recipe.get('totalTime'),
        'photo': {'sourceUrl': image, 'rights': 'pending', 'authorizationEvidence': None},
        'review': {'culinaryApproved': False, 'textReuseEvidence': None},
        'freezing': {'status': 'unknown', 'evidence': None, 'days': None},
    }


class RobotsRules(robotparser.RobotFileParser):
    """Robot parser with wildcard/end-anchor support and longest-match precedence."""
    def can_fetch(self, useragent, url):
        if self.disallow_all:
            return False
        if self.allow_all:
            return True
        if not self.last_checked:
            return False
        agent = useragent.lower().split('/')[0]
        groups = [(len(ua), entry) for entry in self.entries for ua in entry.useragents if ua != '*' and ua.lower() in agent]
        if groups:
            longest = max(length for length, _ in groups)
            selected = [entry for length, entry in groups if length == longest]
        else:
            selected = [self.default_entry] if self.default_entry else []
        parsed = parse.urlsplit(url)
        path = parse.unquote(parsed.path or '/') + ('?' + parsed.query if parsed.query else '')
        matching = []
        for entry in selected:
            for rule in entry.rulelines:
                pattern = parse.unquote(rule.path)
                anchored = pattern.endswith('$')
                if anchored:
                    pattern = pattern[:-1]
                regex = '^' + '.*'.join(re.escape(part) for part in pattern.split('*')) + ('$' if anchored else '')
                if re.search(regex, path):
                    matching.append((len(pattern.replace('*', '')), rule.allowance))
        if not matching:
            return True
        longest = max(length for length, _ in matching)
        return any(allowed for length, allowed in matching if length == longest)


class Collector:
    def __init__(self, output, interval=3):
        self.output = Path(output)
        self.interval, self.last = max(3, interval), None
        self.opener = request.build_opener(SafeRedirect(self.check_redirect))
        self.robots = RobotsRules()
        self.allowed = False

    def check_redirect(self, url):
        if self.allowed and not self.robots.can_fetch(AGENT, url):
            raise ValueError('Redirecionamento bloqueado pelo robots.txt')

    def fetch(self, url, check_robots=True):
        url = trusted_url(url)
        if check_robots and (not self.allowed or not self.robots.can_fetch(AGENT, url)):
            raise ValueError(f'Coleta não permitida pelo robots.txt: {url}')
        if self.last is not None:
            time.sleep(max(0, self.interval - (time.monotonic() - self.last)))
        self.last = time.monotonic()
        try:
            req = request.Request(url, headers={'User-Agent': AGENT, 'Accept': 'text/html,text/plain;q=0.9'})
            with self.opener.open(req, timeout=25) as response:
                final = trusted_url(response.url)
                if check_robots and not self.robots.can_fetch(AGENT, final):
                    raise ValueError('Destino do redirecionamento bloqueado pelo robots.txt')
                data = response.read(MAX_BYTES + 1)
                if len(data) > MAX_BYTES:
                    raise ValueError('Página excede o limite de tamanho')
                charset = response.headers.get_content_charset() or 'utf-8'
                return data.decode(charset)
        except (error.HTTPError, error.URLError) as exc:
            raise RuntimeError(f'Consulta interrompida: {url}: {exc}. Não há retentativa automática ou contorno de bloqueio.') from exc

    def inspect(self):
        text = self.fetch(BASE + 'robots.txt', check_robots=False)
        if not text.strip() or '<html' in text.lower() or not re.search(r'^\s*user-agent\s*:', text, re.I | re.M):
            raise ValueError('robots.txt ausente ou não reconhecido; revisão manual necessária')
        self.robots.parse(text.splitlines())
        self.allowed = True
        delays = [self.robots.crawl_delay(agent) for agent in (AGENT, '*')]
        rates = [self.robots.request_rate(agent) for agent in (AGENT, '*')]
        intervals = [rate.seconds / rate.requests for rate in rates if rate and rate.requests]
        self.interval = max([self.interval] + intervals + [delay for delay in delays if delay is not None])
        if self.interval > 60:
            raise ValueError('Intervalo exigido pelo site excede este coletor; revisão da agenda necessária, sem reduzir o limite da fonte.')
        self.output.mkdir(parents=True, exist_ok=True)
        (self.output / 'robots.txt').write_text(text, encoding='utf-8')
        home = self.fetch(BASE)
        parser = PageParser()
        parser.feed(home)
        terms = sorted({parse.urljoin(BASE, link) for link in parser.links if re.search(r'termos|terms|condicoes|legais', link, re.I)})
        report = {'source': BASE, 'termsLinksToReview': terms, 'robotsText': text, 'recipesCollected': 0,
                  'note': 'Inspeção de acesso. Robots não concede direito de republicar textos ou imagens.'}
        (self.output / 'inspection.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        message = json.dumps(report, ensure_ascii=False)
        print(message)
        if os.environ.get('GITHUB_ACTIONS') == 'true':
            escaped = message.replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
            print(f'::notice title=Inspeção TudoGostoso::{escaped}')
        return parser.links

    def collect(self, policy, limit):
        collection = policy.get('collection', {})
        if collection.get('mode') != 'metadata-only' or collection.get('requestedByUser') is not True:
            raise ValueError('Esta etapa só admite coleta de metadados públicos para curadoria solicitada pelo usuário, sem publicação ou download de fotos.')
        links = self.inspect()
        for seed in policy.get('seeds', []):
            seed = trusted_url(seed)
            if seed != BASE:
                parser = PageParser()
                parser.feed(self.fetch(seed))
                links.extend(parser.links)
                if re.search(r'/receita/\d+[^/]*\.html$', parse.urlsplit(seed).path):
                    links.append(seed)
        urls = set()
        for link in links:
            try:
                url = trusted_url(link)
            except ValueError:
                continue
            if re.search(r'/receita/\d+[^/]*\.html$', parse.urlsplit(url).path):
                urls.add(url)
        selected, rejected = [], []
        for url in sorted(urls)[:30]:
            if len(selected) >= limit:
                break
            body = self.fetch(url)
            extracted = recipes_from_html(body)
            if len(extracted) != 1:
                rejected.append({'url': url, 'reason': 'Página sem Recipe único em JSON-LD'})
                continue
            try:
                item = candidate(extracted[0], url, body)
                if re.search(r'bolo|doce|sobremesa|brigadeiro|pudim|coquetel|drink', item['title'], re.I):
                    rejected.append({'url': url, 'reason': 'Fora do foco inicial de refeições salgadas'})
                    continue
                selected.append(item)
            except ValueError as exc:
                rejected.append({'url': url, 'reason': str(exc)})
        result = {'targetCount': limit, 'collectedCount': len(selected), 'complete': len(selected) == limit,
                  'recipes': selected, 'rejected': rejected, 'published': False}
        (self.output / 'candidates.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
        if os.environ.get('GITHUB_ACTIONS') == 'true':
            for item in selected:
                escaped = json.dumps(item, ensure_ascii=False).replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
                print(f'::notice title=Candidata para revisão::{escaped}')
        if len(selected) != limit:
            raise ValueError(f'Lote incompleto: {len(selected)} de {limit}. Adicione páginas de origem reais às seeds; nenhuma receita será inventada.')
        return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', choices=['inspect', 'collect'], default='inspect')
    parser.add_argument('--policy', default='data/tudogostoso/policy.json')
    parser.add_argument('--output', default='.local/tudogostoso')
    parser.add_argument('--limit', type=int, default=12)
    args = parser.parse_args()
    if not 10 <= args.limit <= 15:
        parser.error('O lote deve ter entre 10 e 15 receitas')
    try:
        collector = Collector(args.output)
        if args.mode == 'inspect':
            collector.inspect()
            print('Inspeção salva; termos e direitos continuam pendentes de revisão.')
        else:
            collector.collect(json.loads(Path(args.policy).read_text(encoding='utf-8')), args.limit)
            print(f'{args.limit} fichas de metadados salvas para revisão. Sem transcrição do preparo, publicação no portal ou download de fotos.')
    except (ValueError, RuntimeError, OSError) as exc:
        print(f'BLOQUEADO: {exc}', file=sys.stderr)
        if os.environ.get('GITHUB_ACTIONS') == 'true':
            message = str(exc).replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
            print(f'::error title=Consulta bloqueada::{message}')
        return 1
    return 0

if __name__ == '__main__':
    sys.exit(main())
