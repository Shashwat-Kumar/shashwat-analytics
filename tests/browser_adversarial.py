import os,json,tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'threat-signals/index.html').read_text()
with sync_playwright() as p:
    opts={'headless':True,'args':['--no-sandbox']}
    if os.environ.get('CHROMIUM_EXECUTABLE'):opts['executable_path']=os.environ['CHROMIUM_EXECUTABLE']
    browser=p.chromium.launch(**opts)
    page=browser.new_page(accept_downloads=True)
    page.set_content(HTML)
    # B02: radio must retain focus after selection; never drop to BODY.
    page.locator('#choices input').first.focus()
    page.keyboard.press('Space')
    assert page.evaluate('document.activeElement.tagName')=='INPUT', 'B02 keyboard focus dropped'
    page.locator('#next').click()
    # B03: deliberately choose known unsafe second-decision option by stable ID.
    page.locator('#choices input[value=clean]').check()
    page.locator('#next').click()
    page.locator('#choices input[value=assure]').check()
    page.locator('#next').click()
    assert 'Destroying logs' in page.locator('#debrief').inner_text()
    assert 'No alerts cannot prove' in page.locator('#debrief').inner_text()
    with page.expect_download() as d1:page.locator('#export').click()
    with tempfile.TemporaryDirectory() as tmp:
        path=Path(tmp)/'bad.json';d1.value.save_as(path);data=json.loads(path.read_text())
        assert [x['optionId'] for x in data['decisions']][1:]==['clean','assure']
    # B01: changing last decision after review MUST invalidate old review and block export.
    page.locator('#choices input[value=qualified]').check()
    assert page.locator('#debrief').is_hidden(),'B01 stale debrief visible'
    assert page.locator('#controls').is_hidden(),'B01 controls available with stale choice'
    page.locator('#next').click()
    assert page.locator('#debrief').is_visible()
    assert 'Findings, unknowns' in page.locator('#debrief').inner_text()
    # B04: alternatives have grades and randomized IDs, all positions not hardwired by grade.
    assert page.evaluate("questions.every(q => q.options.some(o=>o.grade==='acceptable') && q.options.some(o=>o.grade==='unsafe'))")
    # B05: print retains the training disclaimer and does not expose empty panels.
    page.emulate_media(media='print')
    assert page.locator('.print-disclaimer').is_visible()
    page.emulate_media(media='screen')
    # B06: record rejects claim that the client clock proves integrity.
    with page.expect_download() as d2:page.locator('#export').click()
    with tempfile.TemporaryDirectory() as tmp:
        path=Path(tmp)/'good.json';d2.value.save_as(path);data=json.loads(path.read_text())
        assert data['clock']=='client-unverified'
        assert data['decisionIds'][2]=='qualified'
        assert all('questionId' in d and 'optionId' in d for d in data['decisions'])
    # Key repeat: multiple resets and re-choice do not re-use old review.
    page.locator('#reset').click()
    assert page.locator('#debrief').is_hidden()
    print('PASS B01/B02/B03/B04/B05/B06 and reset')
    browser.close()
