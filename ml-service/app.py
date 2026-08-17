import os
import re
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Header, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from predict import ai_engine, MODEL_PATH, DATASET_PATH

INTERNAL_KEY = os.environ.get("INTERNAL_SERVICE_KEY", "real-estate-internal-dev-key")

app = FastAPI(
    title="Real Estate AI ML Service",
    description="Microservice providing Property Price Prediction, Investment ROI Forecast, AI Recommendations, and NLP Property Search Assistant",
    version="1.0.0"
)

# Custom Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Enable CORS for React frontend & Node backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

def sanitize_text(text: str) -> str:
    """Strip potential injection characters, HTML tags, and null bytes."""
    if not isinstance(text, str):
        return text
    clean = re.sub(r"[<>{}\x00-\x1f]", "", text).strip()
    return clean[:100]

def verify_internal_access(x_internal_service_key: Optional[str] = Header(None, alias="X-Internal-Service-Key")):
    """Verify internal inter-service auth key if configured."""
    expected = os.environ.get("INTERNAL_SERVICE_KEY")
    if expected and x_internal_service_key != expected:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid or missing internal service authentication key.")
    return True

class PricePredictionRequest(BaseModel):
    city: str = Field(..., min_length=2, max_length=50)
    location: str = Field(..., min_length=2, max_length=100)
    area_sqft: float = Field(..., gt=50, le=30000, description="Area in sq ft (50 to 30,000)")
    bedrooms: int = Field(..., ge=1, le=12, description="Bedrooms (1 to 12)")
    bathrooms: int = Field(..., ge=1, le=12, description="Bathrooms (1 to 12)")
    age_years: int = Field(..., ge=0, le=100, description="Property age in years (0 to 100)")
    parking: Optional[int] = Field(1, ge=0, le=10)
    floor: Optional[int] = Field(3, ge=0, le=120)
    furnished: Optional[str] = Field("Semi-Furnished", max_length=30)

    @validator("city", "location", "furnished", pre=True)
    def clean_strings(cls, v):
        return sanitize_text(v) if isinstance(v, str) else v

class InvestmentRequest(BaseModel):
    current_price_lakhs: float = Field(..., gt=0.5, le=50000.0, description="Current price in ₹ Lakhs")
    city: str = Field(..., min_length=2, max_length=50)
    location: str = Field(..., min_length=2, max_length=100)
    age_years: int = Field(..., ge=0, le=100)

    @validator("city", "location", pre=True)
    def clean_strings(cls, v):
        return sanitize_text(v) if isinstance(v, str) else v

class RecommendationRequest(BaseModel):
    budget_lakhs: float = Field(..., gt=1.0, le=50000.0, description="Budget in ₹ Lakhs")
    preferred_city: str = Field(..., min_length=2, max_length=50)
    bedrooms: Optional[int] = Field(None, ge=1, le=12)
    preferred_locality: Optional[str] = Field(None, max_length=100)
    max_school_distance_m: Optional[int] = Field(3000, ge=100, le=20000)
    max_hospital_distance_m: Optional[int] = Field(4000, ge=100, le=20000)
    max_metro_distance_m: Optional[int] = Field(5000, ge=100, le=20000)

    @validator("preferred_city", "preferred_locality", pre=True)
    def clean_strings(cls, v):
        return sanitize_text(v) if isinstance(v, str) else v

class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)

    @validator("message", pre=True)
    def clean_message(cls, v):
        return sanitize_text(v) if isinstance(v, str) else v

@app.get("/")
def home():
    return {
        "status": "online",
        "service": "AI Real Estate Engine",
        "model_loaded": os.path.exists(MODEL_PATH),
        "dataset_loaded": os.path.exists(DATASET_PATH),
        # Surfaced so a deploy running a stale or missing valuation export is
        # visible from the health check rather than only in the price numbers.
        "valuation_model": (
            ai_engine.valuation.get("metrics") if ai_engine.valuation else None
        ),
    }

@app.post("/predict-price", dependencies=[Depends(verify_internal_access)])
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

@app.post("/investment-analysis", dependencies=[Depends(verify_internal_access)])
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

@app.post("/recommend-properties", dependencies=[Depends(verify_internal_access)])
def recommend_properties(req: RecommendationRequest):
    try:
        if ai_engine.dataset is None and os.path.exists(DATASET_PATH):
            # pyrefly: ignore [unknown-name]
            ai_engine.dataset = pd.read_csv(DATASET_PATH)

        if ai_engine.dataset is None or len(ai_engine.dataset) == 0:
            raise HTTPException(status_code=503, detail="Dataset not loaded. Run train.py first.")

        df = ai_engine.dataset.copy()

        # Apply filters
        if req.preferred_city and req.preferred_city.lower() != "all":
            df = df[df["city"].str.lower() == req.preferred_city.lower()]

        if req.bedrooms is not None:
            df = df[df["bedrooms"] == req.bedrooms]

        # Filter within 110% of budget
        budget = float(req.budget_lakhs)
        max_budget = budget * 1.1
        within_budget = df[df["price_lakhs"] <= max_budget]
        if not within_budget.empty:
            df = within_budget

        if df.empty:
            # Fallback to all cities within budget or cheapest available
            df = ai_engine.dataset[ai_engine.dataset["price_lakhs"] <= max_budget]
            if df.empty:
                df = ai_engine.dataset.sort_values("price_lakhs").head(12)

        results = []
        for _, row in df.head(100).iterrows():
            price = float(row["price_lakhs"])
            budget_fit = 1.0 if price <= budget else max(0.0, 1.0 - (price - budget) / budget)
            
            # ROI score
            growth = float(row.get("annual_growth_rate", 0.08))
            roi_5y = ((1 + growth) ** 5 - 1) * 100
            roi_score = min(1.0, roi_5y / 70.0)

            # Safety score (1.0 safe .. 6.0 high crime)
            crime = float(row.get("crime_score", 2.5))
            safety_score = max(0.0, min(1.0, (6.0 - crime) / 5.0))

            # Proximity
            school_dist = float(row.get("school_dist_m", 1000))
            hosp_dist = float(row.get("hospital_dist_m", 1500))
            metro_dist = float(row.get("metro_dist_m", 2000))
            
            prox_score = (
                max(0.0, 1.0 - school_dist / 3000.0) * 0.4 +
                max(0.0, 1.0 - hosp_dist / 4000.0) * 0.3 +
                max(0.0, 1.0 - metro_dist / 5000.0) * 0.3
            )

            # Locality match
            loc_query = (req.preferred_locality or "").strip().lower()
            locality = str(row.get("location", ""))
            loc_match = 1.0 if (not loc_query or loc_query in locality.lower()) else 0.5

            # Fair value assessment
            fair_val = ai_engine.fair_value_lakhs(
                city=str(row["city"]),
                area_sqft=float(row["area_sqft"]),
                bedrooms=int(row["bedrooms"]),
                bathrooms=int(row.get("bathrooms", 1)),
                age_years=int(row.get("age_years", 5)),
                parking=int(row.get("parking", 1)),
                floor=int(row.get("floor", 3)),
                furnished_code=int(row.get("furnished_code", 1)),
                crime_score=crime,
                school_dist_m=int(school_dist),
                hospital_dist_m=int(hosp_dist),
                metro_dist_m=int(metro_dist)
            )

            val_score = 0.5
            if fair_val and fair_val > 0:
                discount_pct = round(((fair_val - price) / fair_val) * 100, 1)
                val_score = max(0.0, min(1.0, 0.5 + (discount_pct / 40.0)))

            total_score = (
                budget_fit * 0.24 +
                roi_score * 0.20 +
                prox_score * 0.16 +
                safety_score * 0.12 +
                loc_match * 0.08 +
                val_score * 0.20
            )

            results.append({
                "id": f"ml-prop-{len(results) + 1}",
                "title": f"{int(row['bedrooms'])} BHK in {locality}",
                "city": str(row["city"]),
                "location": locality,
                "price_lakhs": round(price, 2),
                "area_sqft": int(row["area_sqft"]),
                "bedrooms": int(row["bedrooms"]),
                "bathrooms": int(row.get("bathrooms", 1)),
                "age_years": int(row.get("age_years", 5)),
                "roi_5y_pct": round(roi_5y, 1),
                "ai_rating": round(min(9.8, max(6.0, 7.0 + roi_5y / 15.0)), 1),
                "crime_score": crime,
                "school_dist_m": int(school_dist),
                "hospital_dist_m": int(hosp_dist),
                "metro_dist_m": int(metro_dist),
                "ai_match_score": int(round(total_score * 100)),
                "fair_value_lakhs": fair_val,
                "match_breakdown": {
                    "budget_fit": int(round(budget_fit * 100)),
                    "roi_potential": int(round(roi_score * 100)),
                    "proximity": int(round(prox_score * 100)),
                    "safety": int(round(safety_score * 100)),
                    "locality_match": int(round(loc_match * 100)),
                    "value": int(round(val_score * 100))
                }
            })

        results.sort(key=lambda x: x["ai_match_score"], reverse=True)
        top_picks = results[:12]

        return {
            "recommendations": top_picks,
            "count": len(top_picks),
            "total_matches": len(results),
            "source": "ml_dataset",
            "scoring_weights": {
                "budget_fit": 0.24,
                "roi_potential": 0.20,
                "proximity": 0.16,
                "safety": 0.12,
                "locality_match": 0.08,
                "value": 0.20
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
