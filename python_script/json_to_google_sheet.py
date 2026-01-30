import json
from pathlib import Path

import gspread
from google.oauth2.service_account import Credentials

SERVICE_ACCOUNT_FILE = "googleApiKey.json"

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]


def append_data_to_sheet(sheet_name, data_rows):
    """
    Append multiple rows to the first worksheet in the spreadsheet.

    :param sheet_name: Spreadsheet name
    :param data_rows: List of row lists (e.g. [["A", "B"], ["C", "D"]])
    """
    try:
        creds = Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES
        )
        client = gspread.authorize(creds)
        sheet = client.open(sheet_name).get_worksheet(0)

        sheet.append_rows(data_rows)
        print(f"Inserted {len(data_rows)} rows")
    except Exception as e:
        print(f"Error: {e}")
        print("\n[Check]")
        print(f"1. {SERVICE_ACCOUNT_FILE} exists next to this script.")
        print("2. Spreadsheet is shared with the service account email.")
        print("3. Google Sheets API and Drive API are enabled.")


def load_products(json_path):
    with json_path.open("r", encoding="utf-8") as f:
        return json.load(f)


if __name__ == "__main__":
    target_sheet_name = "쿠팡파트너스 상품리스팅"
    json_path = Path(__file__).resolve().parents[1] / "json" / "tesla_products.json"

    products = load_products(json_path)
    data_rows = [
        [
            product.get("name", ""),
            product.get("price", ""),
            product.get("thumb", ""),
            product.get("delivery_type", ""),
        ]
        for product in products
    ]

    print(f"Appending rows to '{target_sheet_name}'...")
    append_data_to_sheet(target_sheet_name, data_rows)
