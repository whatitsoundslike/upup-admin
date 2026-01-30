import json
import os
import feedparser
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from media_utils import clean_html, get_meta_thumb_from_url


def parse_google_date(date_str):
    """
    Convert Google News RSS date format to ISO format.
    Example: 'Sun, 25 Jan 2026 12:45:00 GMT' -> '2026-01-25T12:45:00'
    """
    try:
        dt = parsedate_to_datetime(date_str)
        return dt.isoformat(timespec='seconds')
    except Exception:
        return date_str


def fetch_google_news(query="테슬라", num=20):
    url = f"https://news.google.com/rss/search?q={query}&hl=ko&gl=KR&ceid=KR:ko"
    
    feed = feedparser.parse(url)
    
    if feed.bozo:
        print(f"Error: Failed to parse RSS feed from {url}")
        return []

    # Calculate filtering threshold (2 days ago)
    now = datetime.now(timezone.utc)
    threshold = now - timedelta(days=5)

    # Filter and parse entries
    valid_entries = []
    for entry in feed.entries:
        published_str = entry.get("published")
        if not published_str:
            continue
        
        try:
            published_dt = parsedate_to_datetime(published_str)
            # Make sure it's offset-aware for comparison
            if published_dt.tzinfo is None:
                published_dt = published_dt.replace(tzinfo=timezone.utc)
        except Exception:
            continue

        if published_dt >= threshold:
            valid_entries.append((published_dt, entry))

    # Sort by date (latest first)
    valid_entries.sort(key=lambda x: x[0], reverse=True)

    # Limit to num
    selected_entries = valid_entries[:num]

    news_list = []
    for published_dt, entry in selected_entries:
        # Google News RSS titles usually come in the format "Title - Source"
        title = entry.get("title", "")
        source = ""
        if " - " in title:
            parts = title.rsplit(" - ", 1)
            title = parts[0]
            source = parts[1]
        
        # Alternatively, source might be in entry.source.title if available
        if not source and hasattr(entry, "source"):
            source = entry.source.get("title", "")

        news_list.append({
            "source": source,
            "title": clean_html(title),
            "link": entry.get("link"),
            "thumbnail": "",
            "description": clean_html(entry.get("description", "")),
            "published_at": published_dt.isoformat(timespec='seconds'),
        })
    
    return news_list
