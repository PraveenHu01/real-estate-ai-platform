import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score

# Resolve paths relative to this script's directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_FILE = os.path.join(BASE_DIR, "dataset.csv")
MODEL_FILE = os.path.join(BASE_DIR, "model.pkl")

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
    }
}


def generate_indian_real_estate_dataset(n_samples=10000):
    cities_data = CITIES_DATA

    records = []
    cities = list(cities_data.keys())

    for _ in range(n_samples):
        city = np.random.choice(cities)
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
        
        # Annual appreciation drawn from the city's own band, so Bengaluru
        # compounds faster than Kolkata instead of every city sharing one range.
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

    df = pd.DataFrame(records)
    df.to_csv(DATASET_FILE, index=False)
    print(f"Generated {len(df)} real estate records and saved to {DATASET_FILE}")
    return df

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

    # One-hot encode categorical fields: city and location
    df_encoded = pd.get_dummies(df, columns=["city", "location"], drop_first=True)

    X = df_encoded.drop(columns=["price_lakhs", "annual_growth_rate"])
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
    print(f"R² Score: {r2:.4f}")
    print(f"RMSE (in Lakhs ₹): {rmse:.2f}")

    # Save artifacts
    artifacts = {
        "model": model,
        "scaler": scaler,
        "feature_names": feature_names
    }
    joblib.dump(artifacts, MODEL_FILE)
    print(f"Saved model artifacts to {MODEL_FILE}")

if __name__ == "__main__":
    import sys
    train_model(regenerate="--regenerate" in sys.argv)
