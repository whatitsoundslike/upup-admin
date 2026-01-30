# -*- coding: utf-8 -*-
from email.utils import parsedate_to_datetime

import requests

from media_utils import clean_html, get_media_name_from_domain, get_meta_thumb_from_url


def parse_naver_date(date_str):
    """
    Convert Naver's RFC 1123 date format to ISO format.
    Example: 'Sun, 25 Jan 2026 12:45:00 +0900' -> '2026-01-25T12:45:00'
    """
    try:
        dt = parsedate_to_datetime(date_str)
        return dt.isoformat(timespec="seconds")
    except Exception:
        return date_str


def fetch_naver_news(query="테슬라", num=20, start=1, sort="date"):
    client_id = "KCiFKfw1M1yFNObAz34P"
    client_secret = "_pQqjCZHuS"

    url = "https://openapi.naver.com/v1/search/news.json"
    headers = {
        "X-Naver-Client-Id": client_id,
        "X-Naver-Client-Secret": client_secret,
    }
    params = {
        "query": query,
        "display": num,
        "start": start,
        "sort": sort,
    }

    print(f"Fetching news for '{query}' from Naver API...")
    response = requests.get(url, headers=headers, params=params)

    if response.status_code != 200:
        print(f"Error: API request failed with status code {response.status_code}")
        print(response.text)
        return []

    data = response.json()
    items = data.get("items", [])

    news_list = []
    for item in items:
        news_list.append(
            {
                "source": get_media_name_from_domain(item.get("originallink")),
                "title": clean_html(item.get("title")),
                "link": item.get("link"),
                "thumbnail": get_meta_thumb_from_url(item.get("link")),
                "description": clean_html(item.get("description")),
                "published_at": parse_naver_date(item.get("pubDate")),
            }
        )

    return news_list
