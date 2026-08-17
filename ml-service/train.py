import sys
import os
import json
import hashlib
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Ensure stdout and stderr handle utf-8 safely on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Resolve paths relative to this script's directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_FILE = os.path.join(BASE_DIR, "dataset.csv")
MODEL_FILE = os.path.join(BASE_DIR, "model.pkl")
MODEL_SHA_FILE = os.path.join(BASE_DIR, "model.sha256")

# The exported valuation model lives under backend/utils/ rather than here.
# Both runtimes read this one file — Node bundles it on Vercel (where the
# Python service cannot be deployed at all) and predict.py loads the same copy
# — so a property's fair value cannot differ between the two. Writing a second
# copy into ml-service/ would reintroduce exactly the drift this avoids.
VALUATION_FILE = os.path.join(BASE_DIR, "..", "backend", "utils", "valuationModel.json")

# Set seed for reproducibility
np.random.seed(42)

# Market profiles for all cities. Mirrors CITY_PROFILES in predict.py — keep the
# two files in step so generated training data matches the fallback formula.
CITIES_DATA = {
    # Tier 1 — Metro
    "Mumbai": {
        "locations": ["Bandra West", "Andheri East", "Powai", "Thane", "Navi Mumbai", "Worli", "Juhu", "Goregaon", "Malad", "Borivali"],
        "base_sqft_price": (12000, 38000),
        "crime_range": (1.5, 4.5),
        "growth_rate": (0.075, 0.092)
    },
    "Delhi": {
        "locations": ["Dwarka", "Vasant Kunj", "Rohini", "South Extension", "Janakpuri", "Saket", "Greater Kailash", "Mayur Vihar", "Lajpat Nagar", "Nehru Place"],
        "base_sqft_price": (7500, 22000),
        "crime_range": (2.0, 5.5),
        "growth_rate": (0.068, 0.085)
    },
    "Bengaluru": {
        "locations": ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Electronic City", "Yelahanka", "Marathahalli", "BTM Layout", "JP Nagar", "Bellandur"],
        "base_sqft_price": (6500, 16000),
        "crime_range": (1.0, 3.5),
        "growth_rate": (0.085, 0.110)
    },
    "Hyderabad": {
        "locations": ["Gachibowli", "Hitech City", "Madhapur", "Banjara Hills", "Jubilee Hills", "Kondapur", "Kukatpally", "Miyapur", "Shamshabad", "Secunderabad"],
        "base_sqft_price": (4500, 12000),
        "crime_range": (1.3, 3.8),
        "growth_rate": (0.078, 0.095)
    },
    "Pune": {
        "locations": ["Hinjewadi", "Wakad", "Baner", "Kharadi", "Viman Nagar", "Magarpatta", "Hadapsar", "Aundh", "Koregaon Park", "Pimpri Chinchwad"],
        "base_sqft_price": (5000, 13000),
        "crime_range": (1.2, 3.6),
        "growth_rate": (0.072, 0.088)
    },
    "Chennai": {
        "locations": ["OMR", "Velachery", "Adyar", "Anna Nagar", "T Nagar", "Porur", "Thoraipakkam", "Tambaram", "Nungambakkam", "Sholinganallur"],
        "base_sqft_price": (5500, 14000),
        "crime_range": (1.4, 3.9),
        "growth_rate": (0.065, 0.082)
    },
    "Kolkata": {
        "locations": ["Salt Lake", "New Town", "Rajarhat", "Ballygunge", "Park Street", "Alipore", "Behala", "Jadavpur", "Howrah", "Dum Dum"],
        "base_sqft_price": (3800, 9500),
        "crime_range": (1.8, 4.2),
        "growth_rate": (0.058, 0.075)
    },
    # Tier 2
    "Ahmedabad": {
        "locations": ["SG Highway", "Vastrapur", "Bodakdev", "Satellite", "Maninagar", "Thaltej", "Chandkheda", "Gota", "Bopal", "Prahlad Nagar"],
        "base_sqft_price": (3500, 8500),
        "crime_range": (1.5, 3.8),
        "growth_rate": (0.068, 0.085)
    },
    "Jaipur": {
        "locations": ["Mansarovar", "Vaishali Nagar", "Malviya Nagar", "Jagatpura", "Raja Park", "Tonk Road", "Ajmer Road", "Sitapura", "Mahesh Nagar", "Nirman Nagar"],
        "base_sqft_price": (3200, 7800),
        "crime_range": (1.6, 4.0),
        "growth_rate": (0.065, 0.080)
    },
    "Lucknow": {
        "locations": ["Gomti Nagar", "Hazratganj", "Indira Nagar", "Alambagh", "Aliganj", "Mahanagar", "Rajajipuram", "Vasant Kunj", "Chinhat", "Jankipuram"],
        "base_sqft_price": (3000, 7200),
        "crime_range": (1.7, 4.1),
        "growth_rate": (0.062, 0.078)
    },
    "Chandigarh": {
        "locations": ["Sector 17", "Sector 22", "Sector 35", "Sector 43", "Sector 8", "Mohali", "Panchkula", "Zirakpur", "Sector 34", "Sector 11"],
        "base_sqft_price": (4800, 11500),
        "crime_range": (1.1, 3.2),
        "growth_rate": (0.070, 0.086)
    },
    "Indore": {
        "locations": ["Vijay Nagar", "Palasia", "Bypass Road", "Rau", "AB Road", "Mahalaxmi Nagar", "Super Corridor", "Scheme 54", "Rajendra Nagar", "MR 10"],
        "base_sqft_price": (3500, 7500),
        "crime_range": (1.5, 4.2),
        "growth_rate": (0.070, 0.088)
    },
    "Bhopal": {
        "locations": ["MP Nagar", "Arera Colony", "Kolar Road", "Hoshangabad Road", "Bawadiya Kalan", "Ayodhya Bypass", "Shahpura", "New Market", "Bairagarh", "TT Nagar"],
        "base_sqft_price": (3000, 6500),
        "crime_range": (1.2, 4.0),
        "growth_rate": (0.065, 0.080)
    },
    "Kochi": {
        "locations": ["Kakkanad", "Edappally", "Panampilly Nagar", "Vyttila", "Marine Drive", "Kaloor", "Palarivattom", "Vytilla", "Ernakulam", "Fort Kochi"],
        "base_sqft_price": (4200, 10500),
        "crime_range": (1.3, 3.5),
        "growth_rate": (0.068, 0.083)
    },
    "Coimbatore": {
        "locations": ["RS Puram", "Saibaba Colony", "Peelamedu", "Gandhipuram", "Singanallur", "Saravanampatti", "Vadavalli", "Thudiyalur", "Race Course", "Kalapatti"],
        "base_sqft_price": (3800, 8800),
        "crime_range": (1.2, 3.4),
        "growth_rate": (0.065, 0.080)
    },
    "Nagpur": {
        "locations": ["Dharampeth", "Sadar", "Civil Lines", "Ramdaspeth", "Sitabuldi", "Wardha Road", "Hingna", "Kamptee Road", "Manish Nagar", "Laxmi Nagar"],
        "base_sqft_price": (3200, 7000),
        "crime_range": (1.4, 3.7),
        "growth_rate": (0.062, 0.077)
    },
    "Visakhapatnam": {
        "locations": ["Madhurawada", "Gajuwaka", "MVP Colony", "Dwaraka Nagar", "Siripuram", "Rushikonda", "Yendada", "Asilmetta", "Lawsons Bay", "NAD"],
        "base_sqft_price": (3600, 8200),
        "crime_range": (1.3, 3.6),
        "growth_rate": (0.066, 0.081)
    },
    "Surat": {
        "locations": ["Vesu", "Adajan", "Pal", "Althan", "Ghod Dod Road", "Citylight", "Piplod", "Udhna", "Magdalla", "Parle Point"],
        "base_sqft_price": (3400, 7800),
        "crime_range": (1.4, 3.8),
        "growth_rate": (0.067, 0.083)
    },
    "Gurgaon": {
        "locations": ["DLF Phase 1", "DLF Phase 2", "DLF Phase 3", "Sohna Road", "Golf Course Road", "MG Road", "Sector 56", "Sector 43", "Cyber City", "New Gurgaon"],
        "base_sqft_price": (6500, 18000),
        "crime_range": (1.8, 4.3),
        "growth_rate": (0.072, 0.090)
    },
    "Noida": {
        "locations": ["Sector 62", "Sector 76", "Sector 137", "Greater Noida", "Sector 18", "Sector 52", "Noida Extension", "Sector 78", "Sector 128", "Sector 150"],
        "base_sqft_price": (4500, 11000),
        "crime_range": (1.7, 4.1),
        "growth_rate": (0.070, 0.087)
    },
    "Patna": {
        "locations": ["Boring Road", "Kankarbagh", "Bailey Road", "Danapur", "Rajendra Nagar", "Anisabad", "Saguna More", "Patliputra Colony"],
        "base_sqft_price": (3200, 6800),
        "crime_range": (1.8, 4.3),
        "growth_rate": (0.065, 0.082)
    },
    "Bhubaneswar": {
        "locations": ["Patia", "Saheed Nagar", "Chandrasekharpur", "Khandagiri", "Nayapalli", "Jayadev Vihar", "Sundarpada", "Kalinga Nagar"],
        "base_sqft_price": (3600, 7800),
        "crime_range": (1.2, 3.2),
        "growth_rate": (0.070, 0.086)
    },
    "Raipur": {
        "locations": ["Shankar Nagar", "VIP Road", "Samta Colony", "Devendra Nagar", "Tatibandh", "Telibandha", "Khamardih", "Avanti Vihar"],
        "base_sqft_price": (2800, 6000),
        "crime_range": (1.4, 3.6),
        "growth_rate": (0.066, 0.082)
    },
    "Ranchi": {
        "locations": ["Morabadi", "Harmu", "Bariatu", "Doranda", "Kanke Road", "Ashok Nagar", "Lalpur", "Ratu Road"],
        "base_sqft_price": (2900, 6200),
        "crime_range": (1.5, 3.8),
        "growth_rate": (0.064, 0.079)
    },
    "Vadodara": {
        "locations": ["Alkapuri", "Gotri", "Vasna Road", "Manjalpur", "Karelibaug", "Akota", "Fatehgunj", "Sun Pharma Road"],
        "base_sqft_price": (3200, 7200),
        "crime_range": (1.3, 3.4),
        "growth_rate": (0.068, 0.084)
    },
    "Kanpur": {
        "locations": ["Civil Lines", "Swaroop Nagar", "Kakadeo", "Shyam Nagar", "Kidwai Nagar", "Kalyanpur", "Govind Nagar", "Panki"],
        "base_sqft_price": (2800, 6400),
        "crime_range": (1.8, 4.4),
        "growth_rate": (0.062, 0.078)
    },
    "Varanasi": {
        "locations": ["Sigra", "Lanka", "Shivpur", "Mahmoorganj", "Orderly Bazar", "Cantt", "Sarnath", "Pandeypur"],
        "base_sqft_price": (3100, 6900),
        "crime_range": (1.6, 4.0),
        "growth_rate": (0.068, 0.085)
    },
    "Dehradun": {
        "locations": ["Rajpur Road", "Sahastradhara Road", "Vasant Vihar", "Jakhan", "Clement Town", "Ballupur", "GMS Road", "Hathibarkala"],
        "base_sqft_price": (3800, 8400),
        "crime_range": (1.1, 3.1),
        "growth_rate": (0.072, 0.089)
    },
    "Thiruvananthapuram": {
        "locations": ["Kowdiar", "Pattom", "Kazhakkoottam", "Sasthamangalam", "Vellayambalam", "Technopark", "Sreekaryam", "PTP Nagar"],
        "base_sqft_price": (4200, 9200),
        "crime_range": (1.2, 3.3),
        "growth_rate": (0.069, 0.085)
    },
    "Mysore": {
        "locations": ["Gokulam", "Jayalakshmipuram", "Kuvempunagar", "Vijayanagar", "Hebbal", "Saraswathipuram", "Bogadi", "JP Nagar"],
        "base_sqft_price": (3600, 7600),
        "crime_range": (1.1, 3.2),
        "growth_rate": (0.071, 0.087)
    },
    "Guwahati": {
        "locations": ["GS Road", "Zoo Road", "Beltola", "Six Mile", "Hatigaon", "Ulubari", "Kahilipara", "Jalukbari"],
        "base_sqft_price": (3400, 7400),
        "crime_range": (1.5, 3.9),
        "growth_rate": (0.066, 0.083)
    },
    "Nashik": {
        "locations": ["College Road", "Gangapur Road", "Indira Nagar", "Govind Nagar", "Panchavati", "Ashoka Marg", "Pathardi Phata", "CIDCO"],
        "base_sqft_price": (3100, 6800),
        "crime_range": (1.3, 3.6),
        "growth_rate": (0.067, 0.083)
    }
}


from ingest_zips import extract_real_datasets

def generate_indian_real_estate_dataset(n_samples=25000):
    # 1. Ingest real listings from Gurgaon, Hyderabad, Kolkata, Mumbai
    df_real = extract_real_datasets()
    real_count = len(df_real)
    print(f"Loaded {real_count} real-world listings from 99acres datasets.")

    # 2. Model listings for remaining Indian cities
    cities_data = CITIES_DATA
    # Sample primarily from other cities to ensure balanced geographic coverage
    non_zip_cities = [c for c in cities_data.keys() if c not in ['Gurgaon', 'Hyderabad', 'Kolkata', 'Mumbai']]
    
    records = []
    # Generate ~800 samples per remaining city (~22,400 rows)
    for _ in range(n_samples):
        city = np.random.choice(non_zip_cities)
        city_info = cities_data[city]
        location = np.random.choice(city_info["locations"])
        
        bedrooms = np.random.choice([1, 2, 3, 4, 5], p=[0.15, 0.40, 0.30, 0.10, 0.05])
        area_sqft = bedrooms * np.random.randint(350, 650) + np.random.randint(50, 200)
        bathrooms = max(1, bedrooms - np.random.choice([0, 1]))
        age_years = np.random.randint(0, 25)
        parking = np.random.choice([0, 1, 2], p=[0.2, 0.6, 0.2])
        floor = np.random.randint(1, 21)
        furnished_code = np.random.choice([0, 1, 2]) # 0: Unfurnished, 1: Semi, 2: Fully
        
        crime_score = round(np.random.uniform(city_info["crime_range"][0], city_info["crime_range"][1]), 1)
        school_dist_m = np.random.randint(200, 3500)
        hospital_dist_m = np.random.randint(300, 4500)
        metro_dist_m = np.random.randint(400, 6000)
        
        # Calculate realistic price
        base_rate = np.random.uniform(city_info["base_sqft_price"][0], city_info["base_sqft_price"][1])
        # Multipliers
        age_factor = max(0.65, 1.0 - (age_years * 0.015))
        furnished_factor = 1.0 + (furnished_code * 0.06)
        parking_bonus = parking * 3.5 # 3.5 Lakhs extra per parking
        floor_bonus = (floor * 0.4) if floor > 3 else 0
        proximity_bonus = max(0, (3000 - metro_dist_m) / 1000) * 2.0 + max(0, (2000 - school_dist_m) / 1000) * 1.5
        
        raw_price_rs = (area_sqft * base_rate * age_factor * furnished_factor)
        price_lakhs = (raw_price_rs / 100000.0) + parking_bonus + floor_bonus + proximity_bonus
        # Add slight natural noise
        price_lakhs = round(price_lakhs * np.random.uniform(0.96, 1.04), 2)
        
        growth_lo, growth_hi = city_info["growth_rate"]
        annual_growth_rate = round(np.random.uniform(growth_lo, growth_hi), 3)

        records.append({
            "city": city,
            "location": location,
            "area_sqft": area_sqft,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "age_years": age_years,
            "parking": parking,
            "floor": floor,
            "furnished_code": furnished_code,
            "crime_score": crime_score,
            "school_dist_m": school_dist_m,
            "hospital_dist_m": hospital_dist_m,
            "metro_dist_m": metro_dist_m,
            "annual_growth_rate": annual_growth_rate,
            "price_lakhs": price_lakhs
        })

    df_modeled = pd.DataFrame(records)
    
    # 3. Combine Real + Modeled Datasets
    if not df_real.empty:
        df_combined = pd.concat([df_real, df_modeled], ignore_index=True)
    else:
        df_combined = df_modeled

    df_combined.to_csv(DATASET_FILE, index=False)
    print(f"Generated unified all-India dataset: {len(df_combined)} records ({real_count} real, {len(df_modeled)} modeled) saved to {DATASET_FILE}")
    return df_combined

def export_valuation_model(df, rf_r2, rf_rmse):
    """Fit and export a linear valuation model the Node API can score natively.

    The Random Forest cannot cross the language boundary — 100 trees at depth
    15 serialize to tens of MB and need sklearn to evaluate. The recommendation
    engine does not need the forest's precision: it needs a *fair value* to
    compare each asking price against, and a ridge fit on log-price gives that
    in a form both runtimes can evaluate identically from plain coefficients.

    Log-price is the target because price is multiplicative in this data —
    area, city rate and age decay all scale the price rather than shifting it,
    which is exactly what a linear model in log space represents.
    """
    passthrough_cols = [
        "bedrooms", "bathrooms", "age_years",
        "parking", "floor", "furnished_code",
        "crime_score", "school_dist_m", "hospital_dist_m", "metro_dist_m",
    ]

    X = df[passthrough_cols].astype(float).copy()

    # log(area), not area. Price is very nearly proportional to area, and with
    # log-price as the target a raw-area coefficient would make price grow
    # *exponentially* in area — badly wrong across the 400–3500 sqft range in
    # this data. In log-log form the coefficient is an elasticity and should
    # land near 1.0, which is also a useful sanity check on the fit.
    X.insert(0, "log_area", np.log(df["area_sqft"].astype(float)))

    # Per-city intercepts in log space. Every city in CITIES_DATA gets one, so
    # no market silently falls back to another city's baseline the way the
    # one-hot forest does when a city is missing from its training columns.
    cities = sorted(df["city"].unique())
    for city in cities:
        X[f"city_{city}"] = (df["city"] == city).astype(float)

    y_log = np.log(df["price_lakhs"].astype(float))

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_log, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    ridge = Ridge(alpha=1.0, random_state=42)
    ridge.fit(X_train_scaled, y_train)

    # Score in the original price units, not log units: an R² on log-price
    # would look flattering while saying nothing about rupee accuracy.
    pred_lakhs = np.exp(ridge.predict(X_test_scaled))
    true_lakhs = np.exp(y_test)
    val_r2 = r2_score(true_lakhs, pred_lakhs)
    val_mae = mean_absolute_error(true_lakhs, pred_lakhs)
    # Median absolute percentage error — the figure that matters for a
    # "is this asking price fair?" comparison, and robust to the long tail
    # of Mumbai penthouses that would dominate a mean.
    val_mape = float(np.median(np.abs(pred_lakhs - true_lakhs) / true_lakhs) * 100)

    # Fold the scaler into the coefficients so the consumer needs no scaling
    # step: for standardized x, w·(x-mean)/scale + b == (w/scale)·x + (b - w·mean/scale).
    raw_coef = ridge.coef_ / scaler.scale_
    raw_intercept = float(ridge.intercept_ - np.sum(ridge.coef_ * scaler.mean_ / scaler.scale_))

    columns = list(X.columns)
    numeric_weights = {c: float(w) for c, w in zip(columns, raw_coef) if not c.startswith("city_")}
    city_weights = {
        c[len("city_"):]: float(w) for c, w in zip(columns, raw_coef) if c.startswith("city_")
    }

    # Compute dataset hash for provenance
    with open(DATASET_FILE, "rb") as fh:
        dataset_sha = hashlib.sha256(fh.read()).hexdigest()

    payload = {
        "_comment": (
            "GENERATED FILE — do not edit by hand. Rewritten by "
            "ml-service/train.py; run `python train.py --regenerate` to update. "
            "Ridge regression on log(price_lakhs); predict with "
            "exp(intercept + sum(w_i * x_i) + city_weight)."
        ),
        "target": "log_price_lakhs",
        "intercept": raw_intercept,
        "numeric_weights": numeric_weights,
        "city_weights": city_weights,
        "metrics": {
            "valuation_r2": round(float(val_r2), 4),
            "valuation_mae_lakhs": round(float(val_mae), 2),
            "valuation_median_ape_pct": round(val_mape, 2),
            "forest_r2": round(float(rf_r2), 4),
            "forest_rmse_lakhs": round(float(rf_rmse), 2),
            "training_rows": int(len(df)),
            "cities": len(cities),
            "dataset_sha256": dataset_sha,
        },
    }

    os.makedirs(os.path.dirname(VALUATION_FILE), exist_ok=True)
    with open(VALUATION_FILE, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)
        fh.write("\n")

    print(f"--- Valuation Model (JS-portable) ---")
    print(f"R^2 (price units): {val_r2:.4f}  |  MAE: Rs. {val_mae:.2f}L  |  Median APE: {val_mape:.2f}%")
    print(f"Exported to {os.path.normpath(VALUATION_FILE)}")


def train_model(regenerate=False):
    """Train the price model. Pass regenerate=True (or --regenerate on the
    command line) to rebuild dataset.csv from the current city table — needed
    whenever the city list or price bands change, since a stale CSV from a
    previous run would otherwise be reused silently."""
    expected_cities = len(CITIES_DATA)

    if regenerate or not os.path.exists(DATASET_FILE):
        df = generate_indian_real_estate_dataset()
    else:
        df = pd.read_csv(DATASET_FILE)
        found_cities = df["city"].nunique()
        print(f"Loaded existing dataset with {len(df)} records across {found_cities} cities.")
        # A CSV written before the city table grew would quietly train a model
        # that cannot price the new markets at all.
        if found_cities < expected_cities:
            print(
                f"Dataset covers {found_cities} cities but the config defines "
                f"{expected_cities} — regenerating so the new markets are modelled."
            )
            df = generate_indian_real_estate_dataset()

    # --- Security Guard: Data Hygiene & Outlier Rejection ---
    initial_count = len(df)
    # Filter non-physical area or negative prices
    df = df[(df["area_sqft"] >= 120) & (df["area_sqft"] <= 25000)].copy()
    df = df[(df["price_lakhs"] >= 5.0) & (df["price_lakhs"] <= 50000.0)].copy()
    df = df[(df["bedrooms"] >= 1) & (df["bedrooms"] <= 10)].copy()
    # Rate per sqft sanity filter (₹1,000 to ₹1,50,000/sqft)
    rate_sqft = (df["price_lakhs"] * 100000.0) / df["area_sqft"]
    df = df[(rate_sqft >= 1000.0) & (rate_sqft <= 150000.0)].copy()

    dropped = initial_count - len(df)
    if dropped > 0:
        print(f"[Security] Filtered {dropped} anomalous/outlier records from training set.")

    # One-hot encode categorical fields: city
    df_encoded = pd.get_dummies(df, columns=["city"], drop_first=True)

    drop_cols = [c for c in ["price_lakhs", "annual_growth_rate", "rate_sqft", "location"] if c in df_encoded.columns]
    X = df_encoded.drop(columns=drop_cols)
    y = df_encoded["price_lakhs"]

    feature_names = list(X.columns)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train Random Forest Regressor
    model = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42)
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    print(f"--- Model Training Complete ---")
    print(f"Rows: {len(df)}  |  Cities: {df['city'].nunique()}  |  Features: {len(feature_names)}")
    print(f"R^2 Score: {r2:.4f}")
    print(f"RMSE (in Lakhs Rs.): {rmse:.2f}")

    # Save artifacts
    artifacts = {
        "model": model,
        "scaler": scaler,
        "feature_names": feature_names
    }
    joblib.dump(artifacts, MODEL_FILE)
    print(f"Saved model artifacts to {MODEL_FILE}")

    # Compute and save SHA-256 checksum for model.pkl
    with open(MODEL_FILE, "rb") as fh:
        model_sha = hashlib.sha256(fh.read()).hexdigest()
    with open(MODEL_SHA_FILE, "w", encoding="utf-8") as fh:
        fh.write(model_sha + "\n")
    print(f"Saved model integrity checksum to {MODEL_SHA_FILE}")

    # Export the portable valuation model the recommendation engine scores with.
    export_valuation_model(df, r2, rmse)

if __name__ == "__main__":
    import sys
    train_model(regenerate="--regenerate" in sys.argv)
