import csv
import io
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import utilitykit as u

ROOT = Path(__file__).resolve().parents[1]


class UtilitiesTest(unittest.TestCase):
    def rules(self):
        return u.read_table(ROOT / 'samples/rules.csv')

    def test_csv_quotes_unicode_and_bom(self):
        rows = u.parse_csv('\ufeffname,note\nआशा,"a,b\nnext line"\n')
        self.assertEqual(rows[0]['note'], 'a,b\nnext line')

    def test_csv_invalid_shapes(self):
        for value in ('a,a\n1,2', 'a,b\n1', 'a\n1,2', ',b\n1,2'):
            with self.subTest(value=value), self.assertRaises(ValueError):
                u.parse_csv(value)

    def test_formula_escape(self):
        output = u.csv_text([{'name': '=HYPERLINK("bad")', 'note': ' @SUM(1)', 'normal': 'hello'}])
        row = list(csv.DictReader(io.StringIO(output)))[0]
        self.assertTrue(row['name'].startswith("'="))
        self.assertTrue(row['note'].startswith("' "))

    def test_rules_expected_decisions(self):
        result = u.evaluate_rows(u.read_table(ROOT / 'samples/records.csv'), self.rules())
        self.assertEqual([r[u.META+'rule'] for r in result], ['DEFAULT', 'R02', 'R03', 'R01', 'INPUT_VALIDATION', 'DEFAULT'])
        self.assertEqual(result[0][u.META+'decision'], 'REVIEW')

    def test_invalid_input_overrides_first_matching_rule(self):
        row = {'id':'x', 'consent':'no', 'age':'NaN', 'bureau_score':'700', 'income':'35000'}
        self.assertEqual(u.evaluate_rows([row], self.rules())[0][u.META+'rule'], 'INPUT_VALIDATION')

    def test_rule_numeric_boundary_and_priority(self):
        row = {'consent':'yes','age':'21','bureau_score':'650','income':'25000'}
        self.assertEqual(u.evaluate_rows([row], self.rules(), 'ELIGIBLE')[0][u.META+'decision'], 'ELIGIBLE')
        row.update(consent='no', age='19')
        self.assertEqual(u.evaluate_rows([row], self.rules())[0][u.META+'rule'], 'R01')

    def test_reject_bad_rules(self):
        for change in ({'op':'eval'}, {'value':'NaN','op':'gt'}, {'reason':''}):
            rules = self.rules()
            rules[0].update(change)
            with self.subTest(change=change), self.assertRaises(ValueError):
                u.evaluate_rows([], rules)
        with self.assertRaises(ValueError):
            u.evaluate_rows([], self.rules()+self.rules())

    def test_clean_audit_and_dates(self):
        result = u.clean_rows(u.read_table(ROOT / 'samples/dirty_records.csv'), ['id'], ['id','name','email'], ['joined'])
        self.assertEqual([r[u.META+'status'] for r in result], ['KEEP','DUPLICATE','REVIEW','REVIEW','KEEP'])
        self.assertEqual(result[0]['joined'], '2026-10-14')

    def test_review_row_does_not_consume_dedupe_key(self):
        result = u.clean_rows([{'id':'a','email':''},{'id':'a','email':'a@example.test'}], ['id'], ['email'])
        self.assertEqual(result[1][u.META+'status'], 'KEEP')

    def test_reserved_columns_and_unknown_clean_columns(self):
        with self.assertRaises(ValueError):
            u.clean_rows([{u.META+'status':'KEEP'}])
        with self.assertRaises(ValueError):
            u.clean_rows([{'id':'a'}], ['missing'])

    def test_campaign_honesty_and_flags(self):
        brief = json.loads((ROOT/'samples/campaign_brief.json').read_text())
        output = u.campaigns(brief)
        self.assertEqual(len(output), 4)
        self.assertTrue(all(brief['disclaimer'] in r['message'] and brief['optout'] in r['message'] for r in output))
        self.assertTrue(all('7%' not in r['message'] for r in output))
        brief['benefit'] = 'Guaranteed approval'
        self.assertTrue(all(r['status']=='REVISE' for r in u.campaigns(brief)))

    def test_translation_missing_never_claimed(self):
        output = u.translate_rows([{'text':'Please update your contact details.'},{'text':'Unknown sentence'}],
                                  u.read_table(ROOT/'samples/translation_memory.csv'))
        self.assertEqual(output[0][u.META+'method'], 'MEMORY')
        self.assertEqual(output[1][u.META+'translation'], '')
        self.assertEqual(output[1][u.META+'status'], 'REVIEW_REQUIRED')

    def test_translation_token_loss_flagged(self):
        memory = [{'source':'Pay 500 to {name}', 'target':'भुगतान करें', 'source_language':'en', 'target_language':'hi'}]
        result = u.translate_rows([{'text':'Pay 500 to {name}'}], memory)[0]
        self.assertFalse(result[u.META+'tokens_preserved'])
        self.assertEqual(result[u.META+'status'], 'REVIEW_REQUIRED')

    def test_compare_and_extract(self):
        self.assertEqual(u.compare_text('same', 'same'), [])
        self.assertEqual(u.compare_text('old', 'new')[0]['change'], 'replace')
        fields = {x['field']:x['value'] for x in u.extract_fields('Invoice Number: DEMO-1042\nDate: 2026-10-14\nTotal Amount: INR 12500.00')}
        self.assertEqual(fields, {'invoice_number':'DEMO-1042','date':'2026-10-14','total':'12500.00'})

    def test_cli_end_to_end(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d)/'result.csv'
            run = subprocess.run([sys.executable,str(ROOT/'cli.py'),'rules',str(ROOT/'samples/records.csv'),str(path),'--rules',str(ROOT/'samples/rules.csv')], capture_output=True)
            self.assertEqual(run.returncode, 0, run.stderr)
            self.assertEqual(len(u.read_table(path)), 6)

    @unittest.skipUnless(shutil.which('tesseract'), 'Tesseract not installed')
    def test_real_ocr_on_synthetic_image(self):
        try:
            from PIL import Image, ImageDraw, ImageFont
        except ImportError:
            self.skipTest('Pillow not installed')
        with tempfile.TemporaryDirectory() as d:
            image = Image.new('RGB',(1200,500),'white')
            draw = ImageDraw.Draw(image)
            try:
                font = ImageFont.truetype('DejaVuSans.ttf',36)
            except OSError:
                self.skipTest('Large test font unavailable')
            draw.multiline_text((40,40),'SYNTHETIC INVOICE\nInvoice Number: DEMO-1042\nDate: 2026-10-14\nTotal Amount: INR 12500.00',font=font,fill='black',spacing=25)
            path = Path(d)/'invoice.png'
            image.save(path)
            result = u.ocr_image(path)
            self.assertIn('DEMO-1042',result['text'])
            self.assertEqual(next(r['value'] for r in result['fields'] if r['field']=='total'),'12500.00')

    def test_pdf_merge_extract(self):
        try:
            from pypdf import PdfReader, PdfWriter
        except ImportError:
            self.skipTest('pypdf not installed')
        with tempfile.TemporaryDirectory() as d:
            d = Path(d)
            for name in ['a','b']:
                w = PdfWriter()
                w.add_blank_page(width=200,height=300)
                with open(d/(name+'.pdf'),'wb') as f:
                    w.write(f)
            u.pdf_merge([d/'a.pdf',d/'b.pdf'],d/'merged.pdf')
            self.assertEqual(len(PdfReader(d/'merged.pdf').pages),2)
            u.pdf_extract(d/'merged.pdf',d/'page.pdf',[2])
            self.assertEqual(len(PdfReader(d/'page.pdf').pages),1)
            with self.assertRaises(ValueError):
                u.pdf_extract(d/'merged.pdf',d/'bad.pdf',[3])


if __name__ == '__main__':
    unittest.main()
