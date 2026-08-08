# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional, List
from predict import ai_engine, MODEL_PATH, DATASET_PATH
import os

app = FastAPI(
    title="Real Estate AI ML Service",
    description="Microservice providing Property Price Prediction, Investment ROI Forecast, AI Recommendations, and NLP Property Search Assistant",
    version="1.0.0"
)

# Enable CORS for React frontend & Node backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PricePredictionRequest(BaseModel):
    city: str
    location: str
    area_sqft: float
    bedrooms: int
    bathrooms: int
    age_years: int
    parking: Optional[int] = 1
    floor: Optional[int] = 3
    furnished: Optional[str] = "Semi-Furnished"

class InvestmentRequest(BaseModel):
    current_price_lakhs: float
    city: str
    location: str
    age_years: int

class RecommendationRequest(BaseModel):
    budget_lakhs: float
    preferred_city: str
    bedrooms: Optional[int] = None
    preferred_locality: Optional[str] = None
    max_school_distance_m: Optional[int] = 3000
    max_hospital_distance_m: Optional[int] = 4000
    max_metro_distance_m: Optional[int] = 5000

class AIChatRequest(BaseModel):
    message: str

@app.get("/")
def home():
    return {
        "status": "online",
        "service": "AI Real Estate Engine",
        "model_loaded": os.path.exists(MODEL_PATH),
        "dataset_loaded": os.path.exists(DATASET_PATH)
    }

@app.post("/predict-price")
def predict_price(req: PricePredictionRequest):
    try:
        furnished_code = {"Unfurnished": 0, "Semi-Furnished": 1, "Fully-Furnished": 2}.get(req.furnished, 1)
        predicted_price = ai_engine.predict_price(
            city=req.city,
            location=req.location,
            area_sqft=req.area_sqft,
            bedrooms=req.bedrooms,
            bathrooms=req.bathrooms,
            age_years=req.age_years,
            parking=req.parking,
            floor=req.floor,
            furnished_code=furnished_code
        )
        
        # Calculate price per sqft
        price_per_sqft = round((predicted_price * 100000) / req.area_sqft, 2)
        
        investment = ai_engine.calculate_investment_analysis(
            current_price_lakhs=predicted_price,
            city=req.city,
            location=req.location,
            age_years=req.age_years
        )

        return {
            "predicted_price_lakhs": predicted_price,
            "price_per_sqft": price_per_sqft,
            "currency": "INR",
            "investment_forecast": investment
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/investment-analysis")
def investment_analysis(req: InvestmentRequest):
    try:
        result = ai_engine.calculate_investment_analysis(
            current_price_lakhs=req.current_price_lakhs,
            city=req.city,
            location=req.location,
            age_years=req.age_years
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend-properties")
def recommend_properties(req: RecommendationRequest):
    # Dummy mock algorithm matching properties based on score
    # In production, fetches DB properties and ranks by vector cosine distance or match score
    mock_dataset = [
        {
            "id": "prop-101",
            "title": "Luxury 2BHK Apartment near MP Nagar",
            "city": "Bhopal",
            "location": "MP Nagar",
            "price_lakhs": 58.5,
            "area_sqft": 1150,
            "bedrooms": 2,
            "bathrooms": 2,
            "furnished": "Fully-Furnished",
            "school_dist_m": 450,
            "hospital_dist_m": 800,
            "metro_dist_m": 1200,
            "ai_match_score": 96,
            "roi_5y_pct": 44.5,
            "image": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "prop-102",
            "title": "3BHK Premium Greens Flat",
            "city": "Bhopal",
            "location": "Arera Colony",
            "price_lakhs": 78.0,
            "area_sqft": 1650,
            "bedrooms": 3,
            "bathrooms": 3,
            "furnished": "Semi-Furnished",
            "school_dist_m": 600,
            "hospital_dist_m": 500,
            "metro_dist_m": 900,
            "ai_match_score": 92,
            "roi_5y_pct": 48.0,
            "image": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "prop-103",
            "title": "Modern 2BHK Smart Home",
            "city": "Indore",
            "location": "Vijay Nagar",
            "price_lakhs": 62.0,
            "area_sqft": 1200,
            "bedrooms": 2,
            "bathrooms": 2,
            "furnished": "Fully-Furnished",
            "school_dist_m": 500,
            "hospital_dist_m": 650,
            "metro_dist_m": 800,
            "ai_match_score": 95,
            "roi_5y_pct": 52.1,
            "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "prop-104",
            "title": "Ultra Modern 3BHK Tech Residence",
            "city": "Bengaluru",
            "location": "Indiranagar",
            "price_lakhs": 145.0,
            "area_sqft": 1750,
            "bedrooms": 3,
            "bathrooms": 3,
            "furnished": "Fully-Furnished",
            "school_dist_m": 300,
            "hospital_dist_m": 400,
            "metro_dist_m": 500,
            "ai_match_score": 98,
            "roi_5y_pct": 62.4,
            "image": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80"
        }
    ]

    filtered = [
        p for p in mock_dataset 
        if p["city"].lower() == req.preferred_city.lower() or req.preferred_city.lower() == "all"
    ]
    if not filtered:
        filtered = mock_dataset

    return {
        "recommendations": filtered,
        "count": len(filtered),
        "ai_criteria_used": {
            "budget_lakhs": req.budget_lakhs,
            "preferred_city": req.preferred_city,
            "bedrooms": req.bedrooms
        }
    }

@app.post("/ai-chat")
def ai_chatbot(req: AIChatRequest):
    msg = req.message.lower()
    
    if "bhopal" in msg or "mp nagar" in msg:
        reply = "I found 3 properties in Bhopal matching your criteria! Check out the 2BHK in MP Nagar for ₹58.5 Lakhs with 44.5% projected 5-Year ROI."
    elif "bengaluru" in msg or "indiranagar" in msg:
        reply = "Bengaluru has high capital appreciation! I recommend the 3BHK Tech Residence in Indiranagar for ₹1.45 Cr with an impressive 62.4% 5-Year ROI forecast."
    elif "under" in msg or "budget" in msg or "lakhs" in msg:
        reply = "Got it! Based on your budget constraints, our AI model filtered properties with low risk factors and top proximity scores for schools & hospitals."
    else:
        reply = "Welcome to AI Real Estate Platform! Tell me your target budget, city (Bhopal, Indore, Bengaluru, Mumbai, Delhi), or number of bedrooms, and I'll find top investment options."

    return {
        "reply": reply,
        "suggested_actions": ["Filter by Budget ₹60 Lakhs", "Show High ROI Properties", "Calculate EMI"]
    }

@app.get("/crime-data")
def crime_data(city: str):
    return ai_engine.evaluate_crime_and_safety(city, "")
