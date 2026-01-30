# -*- coding: utf-8 -*-
import re
from urllib.parse import urljoin

import requests
import tldextract
from bs4 import BeautifulSoup


# Keep this ASCII-only to avoid encoding issues; fill in localized names as needed.
DOMAIN_TO_MEDIA: dict[str, str] = {
    # --- 전국 종합지 ---
    "chosun": "조선일보",
    "donga": "동아일보",
    "joongang": "중앙일보",
    "hani": "한겨레",
    "khan": "경향신문",
    "kmib": "국민일보",
    "segye": "세계일보",
    "munhwa": "문화일보",
    "seoul": "서울신문",
    "hankookilbo": "한국일보",
    "naeil": "내일신문",
    "dt": "디지털타임스",
    "heraldcorp": "헤럴드경제",
    "koreaherald": "코리아헤럴드(영문)",
    "koreatimes": "코리아타임스(영문)",
    "yonhapnews": "연합뉴스",
    "newsis": "뉴시스",
    "mk": "매일경제",
    "hankyung": "한국경제",
    "sedaily": "서울경제",
    "mt": "머니투데이",
    "edaily": "이데일리",
    "fnnews": "파이낸셜뉴스",
    "asiae": "아시아경제",
    "asiatoday": "아시아투데이",
    "etnews": "전자신문",
    "etoday": "이투데이",
    "zdnet": "ZDNet Korea",
    "ddaily": "디지털데일리",
    "bloter": "블로터",
    "bizwatch": "비즈워치",
    "news1": "뉴스1",
    "newsway": "뉴스웨이",
    "newspim": "뉴스핌",
    "imeconomynews": "시장경제",
    "thebell": "더벨",
    "businesspost": "비즈니스포스트",
    "bizhankook": "비즈한국",
    "metroseoul": "메트로신문",
    "segyebiz": "세계비즈",
    "kbs": "KBS",
    "imbc": "MBC",
    "sbs": "SBS",
    "ytn": "YTN",
    "mbn": "MBN",
    "ichannela": "채널A",
    "tbs": "TBS",
    "obsnews": "OBS",
    "sisain": "시사IN",
    "sisajournal": "시사저널",
    "dailian": "데일리안",
    "ohmynews": "오마이뉴스",
    "pressian": "프레시안",
    "mediatoday": "미디어오늘",
    "viewsnnews": "뷰스앤뉴스",
    "newdaily": "뉴데일리",
    "goodmorningcc": "굿모닝충청",
    "sisaweek": "시사위크",
    "shindonga": "신동아",
    "inven": "인벤",
    "thisisgame": "디스이즈게임",
    "gamemeca": "게임메카",
    "gamechosun": "게임조선",
    "sportsseoul": "스포츠서울",
    "sportalkorea": "스포탈코리아",
    "mydaily": "마이데일리",
    "stoo": "스포츠투데이",
    "spotvnews": "SPOTV NEWS",
    "busan": "부산일보",
    "idomin": "경남도민일보",
    "gnnews": "경남신문",
    "kwnews": "강원일보",
    "kado": "강원도민일보",
    "idaegu": "대구일보",
    "yeongnam": "영남일보",
    "imaeil": "매일신문(대구)",
    "joongdo": "중도일보(대전/충청)",
    "cctoday": "충청투데이",
    "ccnnews": "CCN뉴스",
    "jbnews": "중부매일",
    "jnilbo": "광주일보",
    "kjdaily": "광주매일신문",
    "jnnews": "전남일보",
    "jeonmae": "전국매일신문",
    "jjilbo": "전주일보",
    "jjan": "전북일보",
    "jejusori": "제주의소리",
    "jejunews": "제주신문",
    "jejutwn": "제주교통복지신문",
    "kyeongin": "경인일보",
    "incheonilbo": "인천일보",
    "kihoilbo": "기호일보",
    "ggilbo": "금강일보",
    "gukjenews": "국제뉴스",
    "newsjeju": "뉴스제주",
    "lawtimes": "법률신문",
    "lawissue": "로이슈",
    "g-enews": "글로벌이코노믹",
    "thefact": "더팩트",
    "v.daum.net": "다음",
    "tokenpost": "토큰포스트",
    "energy-news": "에너지신문",
    "irobotnews": "로봇신문",
    "aitimes": "AI타임즈",
    "yna": "연합뉴스",
    "ccdn": "충청매일",
}


def clean_html(text):
    """
    Remove HTML tags like <b>, </b>, &quot; etc.
    """
    if not text:
        return ""
    clean = re.compile("<.*?>")
    text = re.sub(clean, "", text)
    text = (
        text.replace("&quot;", '"')
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&apos;", "'")
    )
    return text


def get_meta_thumb_from_url(url: str):
    try:
        r = requests.get(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; MetaThumbBot/1.0)",
                "Accept": "text/html,application/xhtml+xml",
            },
            timeout=10,
            allow_redirects=True,
        )
        r.raise_for_status()

        soup = BeautifulSoup(r.text, "html.parser")

        def content(sel):
            tag = soup.select_one(sel)
            return tag.get("content") if tag and tag.has_attr("content") else None

        def href(sel):
            tag = soup.select_one(sel)
            return tag.get("href") if tag and tag.has_attr("href") else None

        img = (
            content('meta[property="og:image"]')
            or content('meta[name="twitter:image"]')
            or href('link[rel="image_src"]')
        )

        return urljoin(url, img) if img else None
    except Exception as e:
        print(f"Error fetching thumbnail for {url}: {e}")
        return None


def get_media_name_from_domain(domain: str) -> str:
    if not domain:
        return "unknown"
    ext = tldextract.extract(domain)
    return DOMAIN_TO_MEDIA.get(ext.domain, ext.domain)
