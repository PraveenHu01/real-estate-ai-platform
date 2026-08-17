import os
import json
import joblib
import pandas as pd
import numpy as np

# Resolve paths relative to this file's directory so uvicorn works from any CWD
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
DATASET_PATH = os.path.join(BASE_DIR, "dataset.csv")

# Shared JS-portable valuation model — the same file Node scores with on
# Vercel, written by train.py. predict_price() prefers it over the forest so a
# price is never returned by an artifact that has silently lost its city
# coverage (see the stale-one-hot comment in predict_price).
VALUATION_PATH = os.path.join(BASE_DIR, "..", "backend", "utils", "valuationModel.json")

# Single source of truth for per-city market assumptions, used by the formula
# fallback, the investment projection, and the safety lookup. Values are the
# midpoints of the bands in train.py — keep the two files in step when either
# changes, or the fallback will disagree with the trained model.
#
#   rate_per_sqft : typical asking rate in Rs/sqft
#   growth        : annual capital appreciation
#   crime         : 1.0 safest .. 6.0 least safe
CITY_PROFILES = {
    # Tier 1 — metro
    "Mumbai":        {"rate_per_sqft": 22000, "growth": 0.084, "crime": 3.0},
    "Delhi":         {"rate_per_sqft": 14000, "growth": 0.077, "crime": 3.8},
    "Bengaluru":     {"rate_per_sqft": 11000, "growth": 0.098, "crime": 2.3},
    "Hyderabad":     {"rate_per_sqft":  8000, "growth": 0.087, "crime": 2.6},
    "Pune":          {"rate_per_sqft":  8800, "growth": 0.080, "crime": 2.4},
    "Chennai":       {"rate_per_sqft":  9500, "growth": 0.074, "crime": 2.7},
    "Kolkata":       {"rate_per_sqft":  6500, "growth": 0.067, "crime": 3.0},
    # NCR satellites
    "Gurgaon":       {"rate_per_sqft": 12200, "growth": 0.081, "crime": 3.1},
    "Noida":         {"rate_per_sqft":  7700, "growth": 0.079, "crime": 2.9},
    # Tier 2
    "Chandigarh":    {"rate_per_sqft":  8100, "growth": 0.078, "crime": 2.2},
    "Kochi":         {"rate_per_sqft":  7300, "growth": 0.076, "crime": 2.4},
    "Coimbatore":    {"rate_per_sqft":  6300, "growth": 0.073, "crime": 2.3},
    "Ahmedabad":     {"rate_per_sqft":  6000, "growth": 0.077, "crime": 2.7},
    "Visakhapatnam": {"rate_per_sqft":  5900, "growth": 0.074, "crime": 2.5},
    "Surat":         {"rate_per_sqft":  5600, "growth": 0.075, "crime": 2.6},
    "Jaipur":        {"rate_per_sqft":  5500, "growth": 0.073, "crime": 2.8},
    "Indore":        {"rate_per_sqft":  5200, "growth": 0.079, "crime": 2.9},
    "Lucknow":       {"rate_per_sqft":  5100, "growth": 0.070, "crime": 2.9},
    "Nagpur":        {"rate_per_sqft":  5100, "growth": 0.070, "crime": 2.6},
    "Bhopal":        {"rate_per_sqft":  4200, "growth": 0.073, "crime": 2.6},
    "Patna":         {"rate_per_sqft":  5000, "growth": 0.073, "crime": 3.0},
    "Bhubaneswar":   {"rate_per_sqft":  5700, "growth": 0.078, "crime": 2.2},
    "Raipur":        {"rate_per_sqft":  4400, "growth": 0.074, "crime": 2.5},
    "Ranchi":        {"rate_per_sqft":  4550, "growth": 0.071, "crime": 2.6},
    "Vadodara":      {"rate_per_sqft":  5200, "growth": 0.076, "crime": 2.3},
    "Kanpur":        {"rate_per_sqft":  4600, "growth": 0.070, "crime": 3.1},
    "Varanasi":      {"rate_per_sqft":  5000, "growth": 0.076, "crime": 2.8},
    "Dehradun":      {"rate_per_sqft":  6100, "growth": 0.080, "crime": 2.1},
    "Thiruvananthapuram": {"rate_per_sqft": 6700, "growth": 0.077, "crime": 2.2},
    "Mysore":        {"rate_per_sqft":  5600, "growth": 0.079, "crime": 2.1},
    "Guwahati":      {"rate_per_sqft":  5400, "growth": 0.074, "crime": 2.7},
    "Nashik":        {"rate_per_sqft":  4950, "growth": 0.075, "crime": 2.4},
}

# Applied to any city absent from the table, so an unlisted city still returns
# a plausible number instead of failing.
DEFAULT_PROFILE = {"rate_per_sqft": 5000, "growth": 0.075, "crime": 2.5}


def city_profile(city: str) -> dict:
    return CITY_PROFILES.get(city, DEFAULT_PROFILE)


class PropertyAIEngine:
    def __init__(self):
        self.artifacts = None
        self.dataset = None
        self.valuation = None
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

        if os.path.exists(VALUATION_PATH):
            try:
                with open(VALUATION_PATH, "r", encoding="utf-8") as fh:
                    self.valuation = json.load(fh)
                metrics = self.valuation.get("metrics", {})
                print(
                    f"Valuation model loaded: {metrics.get('cities')} cities, "
                    f"median APE {metrics.get('valuation_median_ape_pct')}%."
                )
            except Exception as e:
                print(f"Error loading valuationModel.json: {e}")
        else:
            print(f"valuationModel.json not found at {VALUATION_PATH}. Run train.py to generate it.")

        if os.path.exists(DATASET_PATH):
            try:
                self.dataset = pd.read_csv(DATASET_PATH)
                print(f"Dataset loaded: {len(self.dataset)} records.")
            except Exception as e:
                print(f"Error loading dataset.csv: {e}")

    def fair_value_lakhs(self, city, area_sqft, bedrooms, bathrooms, age_years,
                         parking=1, floor=3, furnished_code=1, crime_score=2.5,
                         school_dist_m=800, hospital_dist_m=1200, metro_dist_m=1500):
        """Modelled fair value in lakhs, or None when no valuation model exists.

        Mirrors backend/utils/valuationModel.js exactly — same file, same
        arithmetic — so both runtimes agree to the rupee.
        """
        if not self.valuation or not area_sqft or area_sqft <= 0:
            return None

        features = {
            # Must match train.py and valuationModel.js: the fit is log-log in
            # area, so this is log(area_sqft), not area_sqft.
            "log_area": float(np.log(area_sqft)),
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
        }

        log_price = self.valuation["intercept"]
        for name, weight in self.valuation["numeric_weights"].items():
            log_price += weight * features.get(name, 0)
        log_price += self.valuation["city_weights"].get(city, 0)

        value = float(np.exp(log_price))
        if not np.isfinite(value) or value <= 0:
            return None
        return round(value, 2)

    def predict_price(self, city, location, area_sqft, bedrooms, bathrooms,
                      age_years, parking=1, floor=3, furnished_code=1):
        """Predict property price in Lakhs ₹ using ML model or formula fallback."""
        # The valuation model is preferred over the forest because it carries an
        # explicit weight for every city it was trained on. The forest encodes
        # cities as one-hot *columns*: when its pickle predates a city being
        # added, that column simply does not exist, so predict() silently prices
        # the market as the dropped baseline city instead of failing. A stale
        # model.pkl that way returned Mumbai-like prices for Gurgaon.
        fair = self.fair_value_lakhs(
            city=city, area_sqft=area_sqft, bedrooms=bedrooms, bathrooms=bathrooms,
            age_years=age_years, parking=parking, floor=floor,
            furnished_code=furnished_code,
        )
        if fair is not None:
            return round(max(10.0, fair), 2)

        if self.artifacts:
            try:
                feature_names = self.artifacts["feature_names"]
                scaler = self.artifacts["scaler"]
                model = self.artifacts["model"]

                # Refuse the forest when it has no column for this city, for the
                # reason above — a wrong number is worse than the formula.
                known_cities = [f for f in feature_names if f.startswith("city_")]
                if known_cities and f"city_{city}" not in feature_names:
                    raise ValueError(
                        f"model.pkl has no column for {city} — retrain with "
                        f"`python train.py --regenerate`"
                    )

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

        # Formula Fallback — use city_profile for consistent rates
        profile = city_profile(city)
        age_decay = max(0.65, 1.0 - (age_years * 0.015))
        price_lakhs = (area_sqft * profile["rate_per_sqft"] * age_decay / 100000.0) + (parking * 3.5) + (floor * 0.3)
        return round(price_lakhs, 2)

    def calculate_investment_analysis(self, current_price_lakhs, city, location, age_years):
        """Compute 1Y, 3Y, 5Y projected prices, ROI%, risk, and AI rating."""
        base_rate = city_profile(city)["growth"]

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
        """Derive a safety band from the city's crime score in CITY_PROFILES."""
        score = city_profile(city)["crime"]

        if score <= 2.2:
            zone = "Very Safe"
        elif score <= 2.8:
            zone = "Safe"
        elif score <= 3.5:
            zone = "Moderate"
        else:
            zone = "Moderate Risk"

        # Map 1.0..6.0 crime onto a 10..5 safety rating.
        rating = round(max(5.0, min(9.8, 10.0 - (score * 0.85))), 1)

        return {
            "city": city,
            "crime_score": score,
            "zone": zone,
            "ai_safety_rating": f"{rating}/10",
        }


# Singleton engine — imported by app.py
ai_engine = PropertyAIEngine()
