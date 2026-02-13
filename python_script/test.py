import requests
import csv
import io
import re
import json

SPREADSHEET_ID = "1-8oe7PbWTstJK4qMiCdYmpkOyUwAv7mWk9ir22DNcqQ"
GID = "0"

# ID 매핑 데이터 (ID, 레시피명)
ID_MAPPING_RAW = """
37555797,어남선생 류슈영 만원찜닭 신상출시 편스토랑 kbs 230회 240621
64826305,이정현 만능크림소스 신상출시 편스토랑 kbs 307회 260130
88561361,어남선생 류슈영 대패육전 신상출시 편스토랑 kbs
27596212,감칠맛 폭발 봄동 겉절이 누구나 성공하는 3분 완성 정호영 레시피
94416135,오상진 오목이피클 신상출시 편스토랑 kbs 308회 260206
21290410,어남선생 류슈영 설마간장 비빔국수 신상출시 편스토랑 kbs 223회
37293958,이정현 10분 닭고기전골 신상출시 편스토랑 kbs 307회 260130
67407881,어남선생 류슈영 설마고추장비빔면 신상출시 편스토랑 kbs 241004
91788594,이정현 부채살 육전 신상출시 편스토랑 kbs 303회 260102
37955160,오상진 바나나 프렌치 토스트 신상출시 편스토랑 kbs 308회 260206
50003768,어남선생 류슈영 무침만두 신상출시 편스토랑 kbs 232회
48706277,이정현 참깨오이김밥 신상출시 편스토랑 kbs 287회 250905
97979241,어남선생 류슈영 전간장 | 설 가성비 명절전종류 베스트 10가지 맛있게 만드는 법 신상출시 편스토랑 kbs 238회 240830
83716856,어남선생 류슈영 경양식 만능소스 신상출시 편스토랑 kbs 251회 241206
18204875,이정현 철판계란말이김밥 신상출시 편스토랑 kbs 287회 250905
68769953,어남선생 류슈영 기사식당 왕돈가스 신상출시 편스토랑 kbs 251회 241206
98504037,이정현 1석3조 닭곰탕 신상출시 편스토랑 kbs 295회 251031
47983921,어남선생 류슈영 치킨떡볶이 신상출시 편스토랑 kbs 228회 240607
78433363,어남선생 류슈영 15분 깍두기 신상출시 편스토랑 kbs 255회 250117
65380524,오상진 알배추 크림수프 신상출시 편스토랑 kbs 308회 260206
26739187,이정현 꼬치없는 꼬치전 신상출시 편스토랑 kbs 303회 260102
55234276,이정현 평양냉밥 신상출시 편스토랑 kbs 284회 250815
91484337,어남선생 류슈영 크림떡볶이 신상출시 편스토랑 kbs 232회
20516613,어남선생 류슈영 평생갈비찜 신상출시 편스토랑 kbs 236회 240816
85343653,오상진 연두부비냉 신상출시 편스토랑 kbs 308회 260206
23328290,어남선생 류슈영 불고깃감 육전 신상출시 편스토랑 kbs 94회 210827
33081469,어남선생 류슈영 쟁반막국수 신상출시 편스토랑 kbs 233회
29960955,칠리스 치즈스틱 미국 틱톡에서 핫한 대왕 벽돌크기 인스타푸드
35264012,어남선생 류슈영 어묵국수 신상출시 편스토랑 kbs 235회
58467367,이정현 누룽지 닭곰탕 신상출시 편스토랑 kbs 295회 251031
39297771,이정현 명란찌개 신상출시 편스토랑 kbs 308회 260206
88900588,어남선생 류슈영 만원 반반치킨 신상출시 편스토랑 kbs 223회 250503
94752743,크림김치볶음밥
59412025,딸기 마시멜로우 실타래 탕후루 만들기 요즘 유행 간식 후기
16700704,어남선생 류슈영 천원 깻잎전 신상출시 편스토랑 kbs 246회 241025
40982786,강릉 길감자 집에서 '이것' 넣어 만들기 소스 에어프라이기 야매 레시피, 바삭 쫀득 원조보다 맛있게 후기
59059956,이정현 유자청 갈비찜 신상출시 편스토랑 kbs 303회 260102
55233843,이정현 평양냉면 신상출시 편스토랑 kbs 284회 250815
44836136,어남선생 류슈영 가지전 | 설 가성비 명절전종류 베스트 10가지 맛있게 만드는 법 신상출시 편스토랑 kbs 238회 240830
77413844,이정현 만능겉절이 | 설명절음식 베스트 10가지 모음 구정 반찬 신상출시 편스토랑 kbs 301회 251212
32267489,이정현 차돌명란솥밥 신상출시 편스토랑 kbs 308회 260206
71521840,이정현 표고버섯전 신상출시 편스토랑 kbs 303회 260102
92681365,이정현 더 맑은 갈비탕 신상출시 편스토랑 kbs 303회 260102
35477062,어남선생 류슈영 어묵제육 신상출시 편스토랑 kbs 230회 240621
45931863,10분 완성 제주도 딸기주물럭 만들기 냉동딸기 비율 초간단 알룰로스 저당 설탕 후기
99749394,이정현 자투리 계란말이밥 신상출시 편스토랑 kbs 303회 260102
41128156,이정현 김치냉국 신상출시 편스토랑 kbs 287회 250905
73989187,어남선생 류슈영 오징어회무침 신상출시 편스토랑 kbs 241025
62334087,어남선생 류슈영 진미채덮밥 신상출시 편스토랑 kbs 254회 250110
45892205,어남선생 류슈영 긴급제육 119 신상출시 편스토랑 kbs 237회
93939120,오상진 밀크고구마 신상출시 편스토랑 kbs 308회 260206
72341371,어남선생 류슈영 동태전 | 설 가성비 명절전종류 베스트 10가지 맛있게 만드는 법 신상출시 편스토랑 kbs 238회 240830
82471385,이정현 삼각깻잎전 신상출시 편스토랑 kbs 303회 260102
52913643,이정현 오렌지깍두기 신상출시 편스토랑 kbs 295회 251031
60710716,스타벅스 아이스 두바이 초콜릿 모카 신메뉴 가격 칼로리 내돈내산 솔직후기
84772123,이정현 간장홍게장 신상출시 편스토랑 kbs 286회 250829
79082092,어남선생 류슈영 참간초파스타 신상출시 편스토랑 kbs 238회
40773719,이정현 알싸한 철판 닭갈비 신상출시 편스토랑 kbs 307회 260130
40298839,이정현 양파절임 신상출시 편스토랑 kbs 295회 251031
29222480,스타벅스 아이스 두바이 초콜릿 말차 신메뉴 가격 칼로리 내돈내산 솔직후기
98640055,어남선생 류슈영 양념돼지갈비 신상출시 편스토랑 kbs 243회 241004
""".strip()

def build_id_mapping():
    """ID 매핑 딕셔너리 생성 - nameFood를 키로 사용"""
    mapping = {}
    for line in ID_MAPPING_RAW.split('\n'):
        if not line.strip():
            continue
        parts = line.split(',', 1)
        if len(parts) == 2:
            recipe_id = parts[0].strip()
            name = parts[1].strip()
            mapping[name] = recipe_id
    return mapping

def find_recipe_id(name_food, star, id_mapping):
    """nameFood와 star를 기준으로 ID 찾기"""
    if not name_food:
        return None

    # nameFood에서 | 앞부분만 추출 (예: "유자청 갈비찜| 박수받는..." → "유자청 갈비찜")
    name_food_clean = name_food.split('|')[0].strip()

    for name, recipe_id in id_mapping.items():
        # nameFood가 매핑 이름에 포함되어 있는지 확인
        if name_food_clean in name:
            # star도 일치하는지 확인 (있는 경우)
            if star and star in name:
                return recipe_id
            elif not star:
                return recipe_id

    # star 없이 nameFood만으로 다시 검색
    for name, recipe_id in id_mapping.items():
        if name_food_clean in name:
            return recipe_id

    return None

def replace_units(text):
    """
    T → 큰술 (Tablespoon)
    t → 티스푼 (teaspoon)
    """
    # 대문자 T → 큰술 (T 다음에 영문자가 아닌 경우만)
    text = re.sub(r'(\d+(?:/\d+)?(?:\.\d+)?)\s*T(?![a-zA-Z])', r'\1큰술', text)
    # 소문자 t → 티스푼 (t 다음에 영문자가 아닌 경우만)
    text = re.sub(r'(\d+(?:/\d+)?(?:\.\d+)?)\s*t(?![a-zA-Z])', r'\1티스푼', text)
    return text

def parse_fraction(s):
    """분수 문자열을 float로 변환 (예: '1/2' → 0.5, '1.5' → 1.5)"""
    if '/' in s:
        parts = s.split('/')
        return float(parts[0]) / float(parts[1])
    return float(s)

def parse_ingredient(text):
    """
    재료 문자열을 구조화된 객체로 파싱
    예: "돼지고기 다짐육 300g" → {"foodName": "돼지고기 다짐육", "amount": 300, "unit": "g", ...}
    """
    text = text.strip()
    if not text:
        return None

    # 단위 패턴 (숫자 + 단위)
    # 단위: g, kg, ml, L, 개, 대, 모, 톨, 줌, 컵, 큰술, 티스푼, 꼬집, 조각, 장, 쪽, cm 등
    unit_pattern = r'(\d+(?:/\d+)?(?:\.\d+)?)\s*(g|kg|ml|L|cc|개|대|모|톨|줌|컵|큰술|티스푼|꼬집|조각|장|쪽|cm|알|봉지|팩|마리|근|인분|포기|단|송이|뿌리|통|병|캔|스푼|숟가락|국자|T|t)?$'

    # 괄호 안 내용 제거 (예: "소주 1/2컵(100ml)" → "소주 1/2컵")
    text_clean = re.sub(r'\([^)]*\)', '', text).strip()

    # 끝에서부터 수량+단위 찾기
    match = re.search(unit_pattern, text_clean)

    if match:
        amount_str = match.group(1)
        unit = match.group(2) or ""
        amount = parse_fraction(amount_str)

        # 수량+단위 앞부분이 재료명
        food_name = text_clean[:match.start()].strip()
        if not food_name:
            # "300g 돼지고기" 같은 경우는 거의 없지만 처리
            food_name = text_clean

        return {
            "foodName": food_name,
            "amount": amount,
            "unit": unit,
            "noServing": amount,
            "amountPerNoServing": amount
        }
    else:
        # 수량을 찾지 못한 경우 (예: "소금 약간", "후추 적당량")
        return {
            "foodName": text,
            "amount": 0,
            "unit": "",
            "noServing": 0,
            "amountPerNoServing": 0
        }

def format_recipe_steps(text):
    """
    조리법 텍스트를 깔끔하게 정리
    - 모든 단계를 플랫하게 번호 매김 (1. 2. 3. ...)
    - 섹션 타이틀 (대괄호로 감싸진 것) 제거
    - 무의미한 단계 (재료 손질, 준비 등 단독 타이틀) 제거
    - Tip 문장 분리 (※, *, (*), ✓ 등으로 시작하는 문장)
    - 중복 번호 정리 (1. 1) → 1.)

    Returns: (steps, tips) 튜플
    """
    if not text or not text.strip():
        return "", ""

    # 줄바꿈 정규화 (여러 줄바꿈 → 한 줄바꿈)
    text = re.sub(r'\n\s*\n+', '\n', text)

    # 앞뒤 공백 제거
    lines = [line.strip() for line in text.split('\n')]
    lines = [line for line in lines if line]  # 빈 줄 제거

    formatted_lines = []
    tip_lines = []
    step_num = 1

    # Tip으로 간주하는 시작 패턴
    tip_pattern = r'^[※\*✓✔★☆●○◎◇◆□■△▲▽▼→←↑↓•·\(\*\)]'

    for line in lines:
        # 기존 번호 제거 (0., 1., 2., ...)
        cleaned = re.sub(r'^\d+\.\s*', '', line)

        # 앞의 - 제거
        cleaned = re.sub(r'^-\s*', '', cleaned)

        # 중복 번호 정리 (1) 2) 3-1) 등 추가 번호 제거)
        cleaned = re.sub(r'^\d+\)\s*', '', cleaned)
        cleaned = re.sub(r'^\d+-\d+\)\s*', '', cleaned)  # 3-1) 형태 제거

        # Tip 패턴 확인 - 특수문자/기호로 시작하는 문장
        if re.match(tip_pattern, cleaned):
            # Tip 앞의 기호 제거 (※, *, (*), (* 등)
            tip_text = re.sub(r'^\(\*\s*', '', cleaned)  # (* 제거
            tip_text = re.sub(r'\)$', '', tip_text)  # 끝의 ) 제거
            tip_text = re.sub(r'^[※\*✓✔★☆●○◎◇◆□■△▲▽▼→←↑↓•·]+\s*', '', tip_text)
            if tip_text:
                tip_lines.append(tip_text)
            continue

        # 대괄호로만 이루어진 섹션 타이틀 제거 (예: [재료 준비], [양념장])
        if re.match(r'^\[.+\]$', cleaned):
            continue

        # 대괄호로 시작하는 경우 대괄호 부분 제거 (예: [양념장] 내용 → 내용)
        cleaned = re.sub(r'^\[.+?\]\s*', '', cleaned)

        # 무의미한 단독 타이틀 제거 (짧고 동사가 없는 것들)
        if re.match(r'^(재료\s*손질|재료\s*준비|준비|손질|마무리|완성|플레이팅)$', cleaned):
            continue

        # 실제 내용이 있는 단계에만 번호 부여
        if cleaned:
            formatted_lines.append(f"{step_num}. {cleaned}")
            step_num += 1

    steps = '\n'.join(formatted_lines)
    tips = '\n'.join(tip_lines)
    return steps, tips

# 공개 스프레드시트 CSV export URL
url = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/export?format=csv&gid={GID}"

response = requests.get(url)
response.encoding = 'utf-8'

if response.status_code == 200:
    reader = csv.reader(io.StringIO(response.text))
    data = list(reader)

    # 헤더에서 ingredient, seasoningIngredient, recipeStepsInput 컬럼 인덱스 찾기
    header = data[0]
    ingredient_idx = header.index('ingredient') if 'ingredient' in header else -1
    seasoning_idx = header.index('seasoningIngredient') if 'seasoningIngredient' in header else -1
    recipe_steps_idx = header.index('recipeStepsInput') if 'recipeStepsInput' in header else -1
    name_food_idx = header.index('nameFood') if 'nameFood' in header else -1
    star_idx = header.index('star') if 'star' in header else -1

    # Tips 열 추가
    header.append('Tips')
    tips_idx = len(header) - 1

    # id 열 추가 (맨 앞에)
    header.insert(0, 'id')
    # 인덱스 조정
    ingredient_idx += 1
    seasoning_idx += 1
    recipe_steps_idx += 1
    name_food_idx += 1
    star_idx += 1
    tips_idx += 1

    # ID 매핑 생성
    id_mapping = build_id_mapping()

    print(f"ingredient 컬럼: {ingredient_idx}, seasoningIngredient 컬럼: {seasoning_idx}, recipeStepsInput 컬럼: {recipe_steps_idx}, Tips 컬럼: {tips_idx}")
    print("-" * 50)

    # 데이터 변환
    for i, row in enumerate(data[1:], start=1):  # 헤더 제외
        # nameFood와 star로 ID 찾기
        name_food = row[name_food_idx - 1] if name_food_idx - 1 < len(row) else ""
        star = row[star_idx - 1] if star_idx - 1 < len(row) else ""
        recipe_id = find_recipe_id(name_food, star, id_mapping)

        # id 열 추가 (맨 앞에)
        row.insert(0, recipe_id or "")

        if recipe_id:
            print(f"[{i}] ID 매핑: {name_food} → {recipe_id}")

        if ingredient_idx >= 0 and ingredient_idx < len(row):
            original = row[ingredient_idx]
            # 대괄호 [] 제거
            text = re.sub(r'[\[\]]', '', original)
            # T/t 단위 변환
            text = replace_units(text)
            # 쉼표로 분리하여 구조화된 객체 리스트로 변환
            items = [item.strip() for item in text.split(',') if item.strip()]
            parsed_items = [parse_ingredient(item) for item in items]
            parsed_items = [item for item in parsed_items if item]  # None 제거
            row[ingredient_idx] = json.dumps(parsed_items, ensure_ascii=False)
            if original != row[ingredient_idx]:
                print(f"[{i}] ingredient 변환:")
                print(f"  전: {original[:100]}...")
                print(f"  후: {row[ingredient_idx][:100]}...")

        if seasoning_idx >= 0 and seasoning_idx < len(row):
            original = row[seasoning_idx]
            # 대괄호 [] 제거
            text = re.sub(r'[\[\]]', '', original)
            # T/t 단위 변환
            text = replace_units(text)
            # 쉼표로 분리하여 구조화된 객체 리스트로 변환
            items = [item.strip() for item in text.split(',') if item.strip()]
            parsed_items = [parse_ingredient(item) for item in items]
            parsed_items = [item for item in parsed_items if item]  # None 제거
            row[seasoning_idx] = json.dumps(parsed_items, ensure_ascii=False)
            if original != row[seasoning_idx]:
                print(f"[{i}] seasoningIngredient 변환:")
                print(f"  전: {original[:100]}...")
                print(f"  후: {row[seasoning_idx][:100]}...")

        if recipe_steps_idx >= 0 and recipe_steps_idx < len(row):
            original = row[recipe_steps_idx]
            steps, tips = format_recipe_steps(original)
            # recipeStepsInput에도 단위 변환 적용
            steps = replace_units(steps)
            row[recipe_steps_idx] = steps

            # Tips 열에 데이터 추가 (행 길이 맞추기)
            while len(row) < tips_idx + 1:
                row.append('')
            row[tips_idx] = tips

            if original != steps or tips:
                print(f"[{i}] recipeStepsInput 변환:")
                print(f"  전: {original[:150]}...")
                print(f"  후: {steps[:150]}...")
                if tips:
                    print(f"  Tips: {tips[:100]}...")

    print("-" * 50)
    print("변환 완료!")

    # 변환된 데이터를 CSV 파일로 저장
    import os
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "recipe_transformed.csv")

    with open(out_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(data)

    print(f"\n파일 저장 완료: {os.path.abspath(out_path)}")
else:
    print(f"Error: {response.status_code}")
    print(response.text[:500])
