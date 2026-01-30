import json
import os

from get_news_google_rss import fetch_google_news
from get_news_naver_rss import fetch_naver_news

fileNameMap = {
    "테슬라": "tesla",
    "육아": "baby",
}

def make_news_json(keyword):
    news_results = fetch_naver_news(keyword, 20)
    news_results.extend(fetch_google_news(keyword, 20))

    news_results.sort(key=lambda x: x["published_at"], reverse=True)

    if not news_results:
        print("No news found or error occurred.")
        return

    out_path = os.path.join("data", f"{fileNameMap[keyword]}_news.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(news_results, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(news_results)} news to {out_path}")


if __name__ == "__main__":
    make_news_json("테슬라")
