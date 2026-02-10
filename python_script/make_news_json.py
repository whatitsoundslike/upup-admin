import json
import os
import uuid
import re
from difflib import SequenceMatcher

from get_news_google_rss import fetch_google_news
from get_news_naver_rss import fetch_naver_news

# 카테고리별 검색 키워드 설정
KEYWORD_CONFIG = {
    "tesla": {
        "keywords": ["테슬라", "일론 머스크"],
        "max_per_source": 20,
    },
    "baby": {
        "keywords": [
            "육아 정책",
            "출산 지원금",
            "보육료",
            "아동수당",
            "육아휴직",
            "부모급여",
            "어린이집 정책",
            "출산 정책",
            "다자녀 혜택",
            "신생아 지원",
        ],
        "max_per_source": 10,
        # 제목에 아래 패턴이 포함되면 필터링 (연예/가십/광고성)
        "exclude_patterns": [
            r"♥|♡",  # 연예인 커플
            r"\b(출연|방송|예능|드라마|시청률|공개|촬영)\b",
            r"(에세이|브이로그|유튜브|인스타)",
            r"(호캉스|여행|태교여행)",
            r"\[.*포토\]|\[.*사진\]",
            r"(독박투어|살림남|워킹맘|슈퍼맨)",  # 예능 프로그램
        ],
        # 정책/실용 뉴스 가중치 키워드 (제목에 포함 시 우선)
        "boost_patterns": [
            r"(지원금|보조금|수당|급여|혜택|감면|할인)",
            r"(정책|제도|법안|개정|시행|확대|인상)",
            r"(보육료|어린이집|유치원|돌봄|방과후)",
            r"(출산휴가|육아휴직|근로시간 단축)",
            r"(신청|접수|모집|대상자)",
        ],
    },
    "ai": {
        "keywords": [
            "ChatGPT",
            "챗GPT",
            "OpenAI",
            "Claude AI",
            "Gemini AI",
            "생성형 AI",
            "LLM",
        ],
        "max_per_source": 10,
        # AI 기술과 무관한 뉴스 제외
        "exclude_patterns": [
            r"AI\s?(아나운서|앵커|기상캐스터|성우)",  # 방송 관련
            r"AI\s?(면접|채용|이력서)",  # 채용 관련
            r"AI\s?(그림|일러스트|웹툰)\s?(작가|논란|표절)",  # AI 그림 논란
            r"(예능|드라마|영화|방송|출연|공개|촬영)",  # 연예/방송
            r"\[.*포토\]|\[.*사진\]|\[.*영상\]",  # 포토/영상 뉴스
            r"(주가|시세|투자|매수|매도|상한가|급등|급락)",  # 주식 뉴스
            r"AI\s?(스피커|냉장고|세탁기|에어컨|청소기|가전)",  # 가전제품
            r"(국회|의원|여당|야당|정부|대통령|장관|청와대|총리)",  # 정치
            r"(민주당|국민의힘|조국|윤석열|이재명|한동훈)",  # 정치인/정당
            r"(규제|법안|입법|청문회|국정감사)",  # 정치/입법
        ],
        # 실제 AI 기술 뉴스 우선
        "boost_patterns": [
            r"(ChatGPT|GPT-|챗GPT|OpenAI|오픈AI)",
            r"(Claude|클로드|Anthropic|앤트로픽)",
            r"(Gemini|제미나이|구글 AI|Google AI)",
            r"(LLM|대규모 언어 모델|대형 언어 모델)",
            r"(생성형 AI|생성AI|Generative AI)",
            r"(딥러닝|머신러닝|신경망|트랜스포머)",
            r"(API|SDK|오픈소스|개발자)",
            r"(업데이트|출시|발표|공개|버전)",
        ],
    },
    "desk": {
        "keywords": [
            "데스크 스피커",
            "데스크 테리어",
            "사무용 의자",
            "사무용 책상",
            "사운드 스튜디오",
            "헤드폰",
            "헤드셋"
        ],
        "max_per_source": 10,
    },
}


def _similarity(a: str, b: str) -> float:
    """두 문자열의 유사도 (0~1)"""
    return SequenceMatcher(None, a, b).ratio()


def _deduplicate(news_list: list, threshold: float = 0.6) -> list:
    """제목 유사도 기반 중복 제거. threshold 이상이면 중복으로 판단."""
    result = []
    for item in news_list:
        title = item["title"]
        is_dup = False
        for existing in result:
            if _similarity(title, existing["title"]) >= threshold:
                is_dup = True
                break
        if not is_dup:
            result.append(item)
    return result


def _filter_news(news_list: list, exclude_patterns: list) -> list:
    """제목 기반 필터링 (연예/가십 등 제외)"""
    compiled = [re.compile(p) for p in exclude_patterns]
    filtered = []
    for item in news_list:
        title = item["title"]
        if any(p.search(title) for p in compiled):
            continue
        filtered.append(item)
    return filtered


def _score_news(item: dict, boost_patterns: list) -> int:
    """정책/실용 뉴스 가중치 점수 계산"""
    score = 0
    title = item["title"]
    desc = item.get("description", "")
    text = title + " " + desc
    for pattern in boost_patterns:
        if re.search(pattern, text):
            score += 1
    return score


def make_news_json(keyword):
    config = KEYWORD_CONFIG.get(keyword, {"keywords": [keyword], "max_per_source": 20})
    keywords = config["keywords"]
    max_per = config.get("max_per_source", 20)
    exclude = config.get("exclude_patterns", [])
    boost = config.get("boost_patterns", [])

    all_news = []

    for kw in keywords:
        try:
            naver = fetch_naver_news(kw, max_per)
            all_news.extend(naver)
        except Exception as e:
            print(f"  Naver '{kw}' error: {e}")

        try:
            google = fetch_google_news(kw, max_per)
            all_news.extend(google)
        except Exception as e:
            print(f"  Google '{kw}' error: {e}")

    print(f"  [{keyword}] Raw: {len(all_news)} articles")

    # 1. 필터링 (연예/가십 제거)
    if exclude:
        all_news = _filter_news(all_news, exclude)
        print(f"  [{keyword}] After filter: {len(all_news)} articles")

    # 2. 날짜순 정렬
    all_news.sort(key=lambda x: x.get("published_at", ""), reverse=True)

    # 3. 중복 제거
    all_news = _deduplicate(all_news, threshold=0.6)
    print(f"  [{keyword}] After dedup: {len(all_news)} articles")

    # 4. 정책/실용 뉴스 우선 정렬 (점수 높은 것 먼저, 동점이면 날짜순)
    if boost:
        for item in all_news:
            item["_score"] = _score_news(item, boost)
        all_news.sort(key=lambda x: (-x["_score"], x.get("published_at", "")), reverse=False)
        all_news.sort(key=lambda x: -x["_score"])
        # 점수 필드 제거
        for item in all_news:
            del item["_score"]

    # 5. 최대 40개로 제한
    all_news = all_news[:40]

    # 6. ID/카테고리 부여
    for item in all_news:
        item["id"] = str(uuid.uuid4())
        item["category"] = keyword

    if not all_news:
        print(f"  [{keyword}] No news found.")
        return

    out_path = os.path.join("data", f"{keyword}_news.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_news, f, ensure_ascii=False, indent=2)

    print(f"  [{keyword}] Saved {len(all_news)} news to {out_path}")


if __name__ == "__main__":
    make_news_json("tesla")
    make_news_json("baby")
    make_news_json("ai")
    make_news_json("desk")
