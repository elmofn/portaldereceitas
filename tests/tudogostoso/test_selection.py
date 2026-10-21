import json
from pathlib import Path
import unittest
from urllib.parse import urlsplit

class SelectionTests(unittest.TestCase):
    def test_real_pilot_is_within_requested_range_and_stays_unpublished(self):
        root=Path(__file__).parents[2]
        data=json.loads((root/'data/tudogostoso/review.json').read_text())
        self.assertTrue(10 <= len(data['recipes']) <= 15)
        self.assertEqual(data['selectedCount'],len(data['recipes']))
        self.assertFalse(data['publicationApproved'])
        self.assertFalse(data['fullInstructionsCopied'])
        self.assertEqual(len({item['source']['url'] for item in data['recipes']}),len(data['recipes']))
        for item in data['recipes']:
            self.assertEqual(urlsplit(item['source']['url']).hostname,'www.tudogostoso.com.br')
            self.assertTrue(item['source']['authors'])
            self.assertEqual(item['photo']['rights'],'pending')
            self.assertIsNone(item['photo']['authorizationEvidence'])
            self.assertEqual(item['freezing']['status'],'unknown')
            self.assertIsNone(item['freezing']['days'])
            self.assertNotIn('instructions',item)
            self.assertTrue(item['hasInstructions'])
            self.assertFalse(item['review']['culinaryApproved'])
            self.assertTrue(item['collectionRun'].startswith('https://github.com/elmofn/portaldereceitas/actions/runs/'))

if __name__ == '__main__': unittest.main()
