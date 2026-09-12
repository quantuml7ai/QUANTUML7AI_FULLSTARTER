import pathlib,sys,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'src'))
from ql7_native.tokenizer.codec import QL7Tokenizer
from ql7_native.tokenizer.train import train

class TokenizerBPE(unittest.TestCase):
    def test_bpe_roundtrip_and_compression(self):
        rows=[{"text":"Привет привет привет QL7"} for _ in range(16)]+[{"text":"Hello hello hello QL7"} for _ in range(16)]
        result=train(rows,vocab_size=320,min_frequency=2)
        tok=result['tokenizer']
        self.assertGreater(result['mergeCount'],0)
        text='Привет привет QL7'
        ids=tok.encode(text)
        self.assertEqual(tok.decode(ids),text)
        self.assertLess(len(ids),len(text.encode('utf-8')))
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d)/'tok.json';tok.save(p);loaded=QL7Tokenizer.load(p)
            self.assertEqual(loaded.encode(text),ids);self.assertEqual(loaded.decode(ids),text)
            p2=pathlib.Path(d)/'tok2.json';loaded.save(p2);self.assertEqual(p.read_bytes(),p2.read_bytes())
    def test_legacy_pair_merge_load(self):
        tok=QL7Tokenizer(merges=[[208,159]])
        ids=tok.encode('П')
        self.assertEqual(ids,[256]);self.assertEqual(tok.decode(ids),'П')
    def test_unknown_promoted_id_rejected(self):
        with self.assertRaises(ValueError): QL7Tokenizer().decode([999])
if __name__=='__main__':unittest.main()
