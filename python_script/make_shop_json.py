import requests
import csv
import json
import io
import urllib.parse
import os
import sys

# Mapping of keywords to file names
fileNameMap = {
    "tesla": "tesla",
    "electriccar": "electriccar",
    "baby": "baby"
}

# Mapping of keywords to Google Sheet gid
gidMap = {
    "tesla": "0",
    "baby": "1881135036"
}

def fetch_gsheet_as_json(sheet_url, keyword):
    """
    Fetches a Google Spreadsheet as CSV and converts it to a list of dictionaries.
    The first row of the sheet is used as field names.
    
    Args:
        sheet_url: URL of the Google Sheet
        sheet_name: Optional name of the sheet to select. If provided, will try to find
                   the sheet with this name and use its gid.
    """
    # Parse the URL and remove fragment
    parsed_url = urllib.parse.urlparse(sheet_url)
    query = urllib.parse.parse_qs(parsed_url.query)
    
    # Get gid - use from map if sheet_name is provided, otherwise from URL
    if keyword in gidMap:
        gid = gidMap[keyword]
        print(f"Using gid '{gid}' for sheet name '{keyword}'")
    else:
        gid = query.get('gid', ['0'])[0]
        if keyword:
            print(f"Warning: Sheet name '{keyword}' not found in gidMap. Using gid from URL or default.")
    
    # Construct export URL
    # Replace /edit... with /export
    path_parts = parsed_url.path.split('/')
    if 'edit' in path_parts:
        edit_idx = path_parts.index('edit')
        path_parts = path_parts[:edit_idx] + ['export']
    
    new_path = '/'.join(path_parts)
    export_url = urllib.parse.urlunparse((
        parsed_url.scheme,
        parsed_url.netloc,
        new_path,
        '',
        f'format=csv&gid={gid}',
        ''
    ))

    print(f"Debug: Exporting from {export_url}")
    
    response = requests.get(export_url)
    response.raise_for_status()
    
    # Use response.content.decode('utf-8') to handle BOM and ensure correct decoding
    content = response.content.decode('utf-8-sig')
    
    # Use io.StringIO with the decoded content. 
    # The csv module in Python 3 handles universal newlines if we don't specify them in StringIO,
    # but for csv.reader, we often want to ensure it sees the whole thing.
    f = io.StringIO(content)
    reader = csv.DictReader(f)
    
    data = []
    for row in reader:
        # Clean up keys and values if needed (e.g. stripping whitespace)
        clean_row = {k.strip(): v for k, v in row.items() if k is not None}
        
        # Skip rows where 'name' field is empty
        if 'name' in clean_row and clean_row['name'].strip():
            data.append(clean_row)
    
    data.sort(key=lambda x: x['order'], reverse=True)
    return data

def make_shop_json():
    # Get keyword from command line argument or use default
    if len(sys.argv) > 1:
        keyword = sys.argv[1]
    else:
        keyword = "tesla"
    
    test_url = "https://docs.google.com/spreadsheets/d/1Zocy2KfOAA0UlPmCmci0SIq-cKGf8mXGBpHhKa5UWRA/edit?gid=0#gid=0"
    
    try:
        print(f"Goal: Fetch data from Google Sheet for keyword '{keyword}' and convert to JSON")
        json_data = fetch_gsheet_as_json(test_url, keyword)
        
        # Optionally save to file
        out_path = os.path.join("data", f"{keyword}_shop.json")
        os.makedirs(os.path.dirname(out_path), exist_ok=True)

        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2)
        
    except Exception as e:
        print(f"Error occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    make_shop_json()
