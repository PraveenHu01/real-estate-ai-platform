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


def generate_indian_real_estate_dataset(n_samples=1500):
    cities_data = {
        "Bhopal": {
            "locations": ["MP Nagar", "Arera Colony", "Kolar Road", "Hoshangabad Road", "Bawadiya Kalan", "Ayodhya Bypass"],
            "base_sqft_price": (3000, 6500),
            "crime_range": (1.2, 4.0)
        },
        "Indore": {
            "locations": ["Vijay Nagar", "Palasia", "Bypass Road", "Rau", "AB Road", "Mahalaxmi Nagar"],
            "base_sqft_price": (3500, 7500),
            "crime_range": (1.5, 4.2)
        },
        "Bengaluru": {
            "locations": ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Electronic City", "Yelahanka"],
            "base_sqft_price": (6500, 16000),
            "crime_range": (1.0, 3.5)
        },
        "Mumbai": {
            "locations": ["Bandra West", "Andheri East", "Powai", "Thane", "Navi Mumbai", "Worli"],
            "base_sqft_price": (12000, 38000),
            "crime_range": (1.5, 4.5)
        },
        "Delhi": {
            "locations": ["Dwarka", "Vasant Kunj", "Rohini", "South Extension", "Janakpuri", "Saket"],
            "base_sqft_price": (7500, 22000),
            "crime_range": (2.0, 5.5)
        }
    }

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
        
        # Annual appreciation rate (between 4.5% to 11.5%)
        annual_growth_rate = round(np.random.uniform(0.05, 0.11), 3)

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

def train_model():
    if not os.path.exists(DATASET_FILE):
        df = generate_indian_real_estate_dataset()
    else:
        df = pd.read_csv(DATASET_FILE)
        print(f"Loaded existing dataset with {len(df)} records.")

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
    train_model()
