import asyncio
import subprocess
import os
from datetime import datetime
from make_news_json import make_news_json
from make_shop_json import make_shop_json
from make_subsidy_json import make_subsidy_json
from git_push import git_push

async def main():
    """
    모든 JSON 생성 함수를 실행합니다.
    - make_news_json: 뉴스 데이터 생성
    - make_shop_json: 쇼핑 데이터 생성
    - make_subsidy_json: 전기차 보조금 데이터 생성
    - git add, commit, push 자동 실행
    """
    print("=" * 50)
    print("모든 JSON 파일 생성 시작")
    print("=" * 50)
    
    # 1. 뉴스 JSON 생성
    print("\n[1/3] 뉴스 JSON 생성 중...")
    try:
        make_news_json("tesla")
        make_news_json("baby")
        make_news_json("ai")
        print("✓ 뉴스 JSON 생성 완료")
    except Exception as e:
        print(f"✗ 뉴스 JSON 생성 실패: {e}")
    
    # 2. 쇼핑 JSON 생성
    print("\n[2/3] 쇼핑 JSON 생성 중...")
    try:
        make_shop_json("tesla")
        make_shop_json("baby")
        make_shop_json("ai")
        print("✓ 쇼핑 JSON 생성 완료")
    except Exception as e:
        print(f"✗ 쇼핑 JSON 생성 실패: {e}")
    
    # 3. 전기차 보조금 JSON 생성 (비동기)
    print("\n[3/3] 전기차 보조금 JSON 생성 중...")
    try:
        await make_subsidy_json()
        print("✓ 전기차 보조금 JSON 생성 완료")
    except Exception as e:
        print(f"✗ 전기차 보조금 JSON 생성 실패: {e}")
    
    print("\n" + "=" * 50)
    print("모든 JSON 파일 생성 완료")
    print("=" * 50)
    
    # 4. Git 커밋 및 푸시
    git_push()

if __name__ == "__main__":
    asyncio.run(main())
