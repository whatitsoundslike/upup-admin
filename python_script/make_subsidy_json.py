# -*- coding: utf-8 -*-
from bs4 import BeautifulSoup
import re
import os
import json
import asyncio
from playwright.async_api import async_playwright

def _first_number(text):
	match = re.search(r'\d[\d,]*', text)
	if not match:
	    return None
	return int(match.group().replace(',', ''))

def parse_subsidy(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    tbody = soup.find('tbody') or soup
    subsidies = []

    for tr in tbody.find_all('tr'):
        tds = tr.find_all('td')
        if len(tds) < 8:
            continue

        location_name1 = tds[0].get_text(strip=True)
        location_name2 = tds[1].get_text(strip=True)
        total_text = tds[5].get_text(" ", strip=True)
        recieved_text = tds[6].get_text(" ", strip=True)
        release_text = tds[7].get_text(" ", strip=True)
        remain_text = tds[8].get_text(" ", strip=True)
        etc_text = tds[9].get_text(" ", strip=True) if len(tds) >= 10 else ""

        subsidies.append({
            "locationName1": location_name1,
            "locationName2": location_name2,
            "totalCount": _first_number(total_text) or 0,
            "recievedCount": _first_number(recieved_text) or 0,
            "releaseCount": _first_number(release_text) or 0,
            "remainCount": _first_number(remain_text) or 0,
            "etc": etc_text,
        })

    return subsidies

async def make_subsidy_json():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        url = "https://ev.or.kr/nportal/buySupprt/initSubsidyPaymentCheckAction.do"
        
        try:
            await page.goto(url, wait_until="networkidle", timeout=60000)
            await page.wait_for_selector(".contentList", timeout=30000)

            contentList = await page.query_selector(".contentList")
            table = await contentList.inner_html()
            
            subsidyList = parse_subsidy(table)

            out_path = os.path.join("data", f"electriccar_subside.json")
            os.makedirs(os.path.dirname(out_path), exist_ok=True)

            with open(out_path, "w", encoding="utf-8") as f:
                f.write(json.dumps(subsidyList, ensure_ascii=False, indent=2))

        except Exception as e:
            print(f"오류 발생: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(make_subsidy_json())
    

