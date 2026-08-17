import os
import re
import json
import zipfile
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.join(BASE_DIR, "..")

def parse_price(val):
    if pd.isna(val):
        return None
    s = str(val).strip().replace(',', '')
    if any(k in s.lower() for k in ['request', 'call', '/bedroom', '/month', 'rent']):
        return None
    # Check Cr
    if 'cr' in s.lower():
        m = re.findall(r'[\d\.]+', s)
        if m:
            nums = [float(x) for x in m if x.replace('.', '').isdigit() and float(x) > 0]
            if nums:
                return round(float(np.mean(nums)) * 100.0, 2)
    # Check L / Lakh
    if 'l' in s.lower() or 'lac' in s.lower() or 'lakh' in s.lower():
        m = re.findall(r'[\d\.]+', s)
        if m:
            nums = [float(x) for x in m if x.replace('.', '').isdigit() and float(x) > 0]
            if nums:
                return round(float(np.mean(nums)), 2)
    # Raw rupee numbers
    m = re.findall(r'[\d\.]+', s)
    if m:
        try:
            num = float(m[0])
            if num > 100000:
                return round(num / 100000.0, 2)
            elif 5.0 <= num <= 50000.0:
                return round(num, 2)
        except Exception:
            pass
    return None

def parse_area(val):
    if pd.isna(val):
        return None
    s = str(val).strip().replace(',', '')
    m = re.findall(r'[\d\.]+', s)
    if m:
        nums = [float(x) for x in m if x.replace('.', '').isdigit() and float(x) > 0]
        if nums:
            return round(float(np.mean(nums)), 1)
    return None

def extract_locality(row):
    if 'LOCALITY' in row and pd.notna(row['LOCALITY']) and str(row['LOCALITY']).strip():
        return str(row['LOCALITY']).strip()
    loc_val = row.get('location')
    if pd.notna(loc_val):
        s = str(loc_val)
        m = re.search(r"'LOCALITY_NAME':\s*'([^']+)'", s)
        if m:
            return m.group(1).strip()
    return 'City Centre'

def extract_real_datasets():
    zips = {
        'Gurgaon': os.path.join(ROOT_DIR, 'gurgaon_10k.csv.zip'),
        'Hyderabad': os.path.join(ROOT_DIR, 'hyderabad.csv.zip'),
        'Kolkata': os.path.join(ROOT_DIR, 'kolkata.csv.zip'),
        'Mumbai': os.path.join(ROOT_DIR, 'mumbai.csv.zip'),
    }

    records = []
    for target_city, zip_path in zips.items():
        if not os.path.exists(zip_path):
            print(f"Skipping {target_city}: {zip_path} not found.")
            continue
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            csv_name = zip_ref.namelist()[0]
            with zip_ref.open(csv_name) as f:
                df = pd.read_csv(f, low_memory=False)
                count = 0
                for _, row in df.iterrows():
                    area = parse_area(row.get('AREA') or row.get('CARPET_SQFT') or row.get('SUPERBUILTUP_SQFT'))
                    price = parse_price(row.get('PRICE') or row.get('MIN_PRICE') or row.get('MAX_PRICE'))
                    
                    try:
                        bedrooms = int(float(row.get('BEDROOM_NUM', 2))) if pd.notna(row.get('BEDROOM_NUM')) else 2
                    except Exception:
                        bedrooms = 2

                    try:
                        bathrooms = int(float(row.get('BATHROOM_NUM', max(1, bedrooms - 1)))) if pd.notna(row.get('BATHROOM_NUM')) else max(1, bedrooms - 1)
                    except Exception:
                        bathrooms = max(1, bedrooms - 1)

                    try:
                        age = int(float(row.get('AGE', 3))) if pd.notna(row.get('AGE')) else 3
                    except Exception:
                        age = 3

                    try:
                        floor = int(float(row.get('FLOOR_NUM', 3))) if pd.notna(row.get('FLOOR_NUM')) else 3
                    except Exception:
                        floor = 3

                    try:
                        furnish_code = int(float(row.get('FURNISH', 1))) if pd.notna(row.get('FURNISH')) else 1
                        if furnish_code > 2:
                            furnish_code = 2
                    except Exception:
                        furnish_code = 1

                    if area and price and 200 <= area <= 15000 and 5.0 <= price <= 30000.0 and 1 <= bedrooms <= 10:
                        rate_sqft = (price * 100000.0) / area
                        if 1500 <= rate_sqft <= 150000:
                            loc = extract_locality(row)
                            records.append({
                                'city': target_city,
                                'location': loc,
                                'area_sqft': area,
                                'bedrooms': bedrooms,
                                'bathrooms': bathrooms,
                                'age_years': max(0, min(50, age)),
                                'parking': 1 if bedrooms >= 2 else 0,
                                'floor': max(0, min(100, floor)),
                                'furnished_code': furnish_code,
                                'crime_score': 2.8 if target_city == 'Gurgaon' else (2.5 if target_city == 'Hyderabad' else (3.0 if target_city == 'Mumbai' else 2.7)),
                                'school_dist_m': np.random.randint(300, 2500),
                                'hospital_dist_m': np.random.randint(400, 3000),
                                'metro_dist_m': np.random.randint(500, 4000),
                                'annual_growth_rate': 0.082 if target_city == 'Gurgaon' else (0.087 if target_city == 'Hyderabad' else (0.084 if target_city == 'Mumbai' else 0.067)),
                                'price_lakhs': price
                            })
                            count += 1
                print(f"Extracted {count} real listings for {target_city}")

    print(f"Total extracted real listing records: {len(records)}")
    return pd.DataFrame(records)

if __name__ == "__main__":
    df_real = extract_real_datasets()
    print("Sample records:")
    print(df_real.head(3))
