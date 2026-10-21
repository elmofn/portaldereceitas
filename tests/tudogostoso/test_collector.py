import importlib.util
import pathlib
import tempfile
import unittest

path = pathlib.Path(__file__).parents[2] / 'scripts/tudogostoso/collector.py'
spec = importlib.util.spec_from_file_location('collector', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class CollectorTests(unittest.TestCase):
    def test_domain_and_redirect_restrictions(self):
        self.assertEqual(module.trusted_url('/receita/123-prato.html?ref=x'), 'https://www.tudogostoso.com.br/receita/123-prato.html')
        for url in ['http://www.tudogostoso.com.br/', 'https://www.tudogostoso.com.br.evil.test/', 'https://user:pass@www.tudogostoso.com.br/', 'https://127.0.0.1/', 'https://www.tudogostoso.com.br:444/']:
            with self.assertRaises(ValueError): module.trusted_url(url)

    def test_extracts_graph_sections_without_executing_html(self):
        page = '<script type="application/ld+json">{"@graph":[{"@type":"Recipe","name":"Registro de teste","recipeInstructions":[{"@type":"HowToSection","itemListElement":[{"@type":"HowToStep","text":"Texto &amp; marcação"}]}]}]}</script>'
        recipes = module.recipes_from_html(page)
        self.assertEqual(len(recipes), 1)
        self.assertEqual(module.instructions(recipes[0]['recipeInstructions']), ['Texto & marcação'])
        self.assertEqual(module.recipes_from_html('<script type="application/ld+json">invalid</script>'), [])

    def test_candidate_requires_authorship_photo_and_sets_no_freezing_claim(self):
        data = {'name':'Registro de teste', 'recipeIngredient':['Campo original'], 'recipeInstructions':['Passo original'], 'author':{'name':'Autoria de teste'}, 'image':{'url':'https://photos.example.test/photo.jpg'}}
        result = module.candidate(data, 'https://www.tudogostoso.com.br/receita/123-teste.html', 'page')
        self.assertEqual(result['freezing']['status'], 'unknown')
        self.assertEqual(result['photo']['rights'], 'pending')
        self.assertNotIn('instructions', result)
        self.assertTrue(result['hasInstructions'])
        self.assertEqual(result['ingredients'], data['recipeIngredient'])
        for key in ['author','image','recipeIngredient','recipeInstructions']:
            invalid = {k:v for k,v in data.items() if k != key}
            with self.assertRaises(ValueError): module.candidate(invalid, result['source']['url'], 'page')

    def test_collection_scope_and_robots_denies_fetch(self):
        with tempfile.TemporaryDirectory() as folder:
            collector = module.Collector(folder)
            with self.assertRaises(ValueError): collector.collect({'terms':{'reviewed':False}},12)
            collector.robots.parse(['User-agent: *','Disallow: /receita/'])
            collector.allowed = True
            with self.assertRaises(ValueError): collector.fetch('https://www.tudogostoso.com.br/receita/123-teste.html')

    def test_initial_meal_focus(self):
        for title in ['Arroz integral com legumes', 'Sopa de lentilha', 'Frango assado', 'Carne de panela']:
            self.assertTrue(module.suitable_title(title))
        for title in ['Brownie super fácil', 'Coxinha com batata', 'Iogurte caseiro', 'Bobó de camarão']:
            self.assertFalse(module.suitable_title(title))

    def test_robots_wildcards_and_allow_precedence(self):
        rules = module.RobotsRules()
        rules.parse(['User-agent: *', 'Disallow: *recipe_id=*', 'Disallow: /busca', 'Disallow: /private/*', 'Allow: /private/public$', 'User-agent: SpecialBot', 'Disallow: /'])
        self.assertFalse(rules.can_fetch(module.AGENT, module.BASE + '?recipe_id=123'))
        self.assertFalse(rules.can_fetch(module.AGENT, module.BASE + 'private/secret'))
        self.assertTrue(rules.can_fetch(module.AGENT, module.BASE + 'private/public'))
        self.assertFalse(rules.can_fetch('SpecialBot', module.BASE))
        self.assertTrue(rules.can_fetch(module.AGENT, module.BASE + 'receita/123-prato.html'))

if __name__ == '__main__': unittest.main()
