import os
import joblib
import pandas as pd
import numpy as np

# Resolve paths relative to this file's directory so uvicorn works from any CWD
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
DATASET_PATH = os.path.join(BASE_DIR, "dataset.csv")


class PropertyAIEngine:
    def __init__(self):
        self.artifacts = None
        self.dataset = None
        self.load_artifacts()

    def load_artifacts(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.artifacts = joblib.load(MODEL_PATH)
                print("ML Engine loaded model.pkl successfully.")
            except Exception as e:
                print(f"Error loading model.pkl: {e}")
        else:
            print(f"model.pkl not found at {MODEL_PATH}. Using formula fallback. Run train.py first.")

        if os.path.exists(DATASET_PATH):
            try:
                self.dataset = pd.read_csv(DATASET_PATH)
                print(f"Dataset loaded: {len(self.dataset)} records.")
            except Exception as e:
                print(f"Error loading dataset.csv: {e}")

    def predict_price(self, city, location, area_sqft, bedrooms, bathrooms,
                      age_years, parking=1, floor=3, furnished_code=1):
        """Predict property price in Lakhs ₹ using ML model or formula fallback."""
        if self.artifacts:
            try:
                feature_names = self.artifacts["feature_names"]
                scaler = self.artifacts["scaler"]
                model = self.artifacts["model"]

                input_dict = {f: 0 for f in feature_names}

                # Numerical features
                num_map = {
                    "area_sqft": area_sqft,
                    "bedrooms": bedrooms,
                    "bathrooms": bathrooms,
                    "age_years": age_years,
                    "parking": parking,
                    "floor": floor,
                    "furnished_code": furnished_code,
                    "crime_score": 2.5,
                    "school_dist_m": 800,
                    "hospital_dist_m": 1200,
                    "metro_dist_m": 1500,
                }
                for key, val in num_map.items():
                    if key in input_dict:
                        input_dict[key] = val

                # One-hot city and location
                city_col = f"city_{city}"
                loc_col = f"location_{location}"
                if city_col in input_dict:
                    input_dict[city_col] = 1
                if loc_col in input_dict:
                    input_dict[loc_col] = 1

                df_input = pd.DataFrame([input_dict])[feature_names]
                scaled_input = scaler.transform(df_input)
                predicted = model.predict(scaled_input)[0]
                return round(max(10.0, float(predicted)), 2)
            except Exception as e:
                print(f"ML prediction error, falling back to formula: {e}")

        # Formula Fallback — city base rates per sq.ft in ₹
        base_rate = {
            "Bhopal": 4200,
            "Indore": 5200,
            "Bengaluru": 11000,
            "Mumbai": 22000,
            "Delhi": 14000
        }.get(city, 5000)
        age_decay = max(0.65, 1.0 - (age_years * 0.015))
        price_lakhs = (area_sqft * base_rate * age_decay / 100000.0) + (parking * 3.5) + (floor * 0.3)
        return round(price_lakhs, 2)

    def calculate_investment_analysis(self, current_price_lakhs, city, location, age_years):
        """Compute 1Y, 3Y, 5Y projected prices, ROI%, risk, and AI rating."""
        city_growth_rates = {
            "Bengaluru": 0.095,
            "Mumbai": 0.085,
            "Delhi": 0.080,
            "Indore": 0.078,
            "Bhopal": 0.072,
        }
        base_rate = city_growth_rates.get(city, 0.075)

        if age_years < 5:
            base_rate += 0.015
        elif age_years > 15:
            base_rate -= 0.010

        pred_1y = round(current_price_lakhs * ((1 + base_rate) ** 1), 2)
        pred_3y = round(current_price_lakhs * ((1 + base_rate) ** 3), 2)
        pred_5y = round(current_price_lakhs * ((1 + base_rate) ** 5), 2)

        roi_5y = round(((pred_5y - current_price_lakhs) / current_price_lakhs) * 100, 1)

        risk = "Moderate" if age_years > 15 else "Low"

        base_score = 7.0 + (roi_5y / 15.0)
        ai_rating = round(min(9.8, max(5.0, base_score)), 1)

        return {
            "current_price_lakhs": current_price_lakhs,
            "predicted_price_1y": pred_1y,
            "predicted_price_3y": pred_3y,
            "predicted_price_5y": pred_5y,
            "expected_roi_5y_pct": roi_5y,
            "risk_level": risk,
            "annual_cagr_pct": round(base_rate * 100, 1),
            "ai_rating": ai_rating,
        }

    def evaluate_crime_and_safety(self, city: str, location: str = "") -> dict:
        city_crime = {
            "Bhopal":     {"crime_score": 2.4, "zone": "Safe",          "ai_safety_rating": "9.1/10"},
            "Indore":     {"crime_score": 2.1, "zone": "Very Safe",     "ai_safety_rating": "9.4/10"},
            "Bengaluru":  {"crime_score": 2.8, "zone": "Safe",          "ai_safety_rating": "8.8/10"},
            "Mumbai":     {"crime_score": 3.1, "zone": "Moderate",      "ai_safety_rating": "8.5/10"},
            "Delhi":      {"crime_score": 4.5, "zone": "Moderate Risk", "ai_safety_rating": "7.4/10"},
        }
        return city_crime.get(city, {"crime_score": 2.5, "zone": "Safe", "ai_safety_rating": "8.9/10"})


# Singleton engine — imported by app.py
ai_engine = PropertyAIEngine()
