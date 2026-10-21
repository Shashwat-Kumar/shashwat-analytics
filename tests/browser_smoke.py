import os,json,tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'threat-signals'/'index.html').read_text()
with sync_playwright() as p:
    kwargs={'headless':True,'args':['--no-sandbox']}
    executable=os.environ.get('CHROMIUM_EXECUTABLE')
    if executable: kwargs['executable_path']=executable
    browser=p.chromium.launch(**kwargs)
    for width,height in [(1440,900),(390,844)]:
        context=browser.new_context(viewport={'width':width,'height':height},accept_downloads=True)
        page=context.new_page();errors=[];out=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda r:out.append(r.url) if r.url.startswith('http') else None)
        page.set_content(HTML,wait_until='load')
        assert page.locator('#choices input').count()==3
        assert page.locator('#next').is_disabled()
        for i in range(3):
            page.locator('#choices input').first.check()
            assert page.locator('#next').is_enabled()
            page.locator('#next').click()
        assert page.locator('#debrief').is_visible() and page.locator('#controls').is_visible()
        page.locator('#checks input').first.check()
        with page.expect_download() as dl:page.locator('#export').click()
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'record.json';dl.value.save_as(path);data=json.loads(path.read_text())
            assert data['appVersion']=='threat-signals-0.3.0'
            manifest=json.loads((ROOT/'REVIEW_MANIFEST.json').read_text())
            assert data['codeFingerprint']==manifest['sourceTemplateSha256']
            assert data['integrity'].startswith('none')
            assert data['controls'][0]['selfReportedEvidence']
            assert len(data['decisions'])==3
        if width==390:
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2')
            assert page.locator('header nav a').first.is_visible()
        page.locator('#reset').click()
        assert page.locator('#controls').is_hidden()
        assert page.locator('#next').is_disabled()
        assert not errors,errors
        assert not out,out
        print(f'PASS browser {width}px: finish, export, reset, navigation, no errors or external requests')
        context.close()
    browser.close()
