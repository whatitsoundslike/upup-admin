import json
import os
import uuid

from get_news_google_rss import fetch_google_news
from get_news_naver_rss import fetch_naver_news

fileNameMap = {
    "tesla": "테슬라",
    "baby": "육아",
}

def make_news_json(keyword):
    news_results = fetch_naver_news(fileNameMap[keyword], 20)
    news_results.extend(fetch_google_news(fileNameMap[keyword], 20))

    news_results.sort(key=lambda x: x["published_at"], reverse=True)
    for item in news_results:
        item["id"] = str(uuid.uuid4())
        item["category"] = keyword

    if not news_results:
        print("No news found or error occurred.")
        return

    out_path = os.path.join("data", f"{keyword}_news.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(news_results, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(news_results)} news to {out_path}")


if __name__ == "__main__":
    make_news_json("tesla")
