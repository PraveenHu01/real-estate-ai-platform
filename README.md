# 🏢 AI-Powered Real Estate Investment & Property Recommendation Platform

> **Resume Title:** AI-Powered Real Estate Investment & Property Recommendation Platform using React, Node.js, MongoDB, Python, Machine Learning, Google Maps, and JWT Authentication

A full-stack, production-grade web application that helps users **buy, rent, and invest in properties** using Artificial Intelligence — featuring ML price prediction, 5-year ROI forecasts, crime safety analysis, and real-time buyer-seller chat.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (Vite), Tailwind CSS, Recharts, Leaflet Maps, Socket.IO Client |
| **Backend** | Node.js, Express.js, Socket.IO, JWT Auth, bcryptjs, MongoDB/Mongoose |
| **ML Service** | Python, FastAPI, Scikit-Learn (Random Forest), Pandas, NumPy, Joblib |
| **Database** | MongoDB (with in-memory fallback for demo) |
| **Maps** | Leaflet + OpenStreetMap (free, no API key required) |
| **Auth** | JWT (JSON Web Tokens), bcrypt password hashing |

---

## 📁 Project Structure

```
Real Estate AI Platform/
├── frontend/                   # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/         # Navbar, Footer, PropertyCard, EMICalculator,
│   │   │                       # FacilityDistanceMap, CrimeHeatMap,
│   │   │                       # PropertyComparator, AIChatbotWidget, ChatModal
│   │   ├── pages/              # Home, Properties, Details, PricePredictor,
│   │   │                       # InvestmentAnalysis, AIRecommendations, Compare,
│   │   │                       # Wishlist, Chat, LoanCalculator, Analytics,
│   │   │                       # AdminDashboard, Login, Register, AddProperty
│   │   ├── context/            # AuthContext, WishlistContext
│   │   └── services/           # Axios API client
│   └── package.json
│
├── backend/                    # Node.js + Express REST API + Socket.IO
│   ├── controllers/            # auth, property, ai (ML proxy), chat, admin, analytics
│   ├── routes/                 # All route definitions
│   ├── models/                 # User, Property, Chat, Wishlist (MongoDB schemas)
│   ├── middleware/             # authMiddleware (JWT), roleMiddleware (RBAC)
│   ├── utils/seedData.js       # 5-city Indian property seed data
│   ├── server.js               # Express + Socket.IO entry point
│   └── package.json
│
└── ml-service/                 # Python FastAPI ML Microservice
    ├── train.py                # Generates dataset + trains Random Forest model
    ├── predict.py              # PropertyAIEngine class (predict + investment logic)
    ├── app.py                  # FastAPI endpoints
    ├── dataset.csv             # Generated after running train.py
    ├── model.pkl               # Saved ML artifacts (generated after train.py)
    └── requirements.txt        # Python dependencies
```

---

## 🤖 All 16 Modules Implemented

| # | Module | Status |
|---|---|---|
| 1 | **Authentication** — Login, Register, JWT, Role-based (Buyer/Seller/Admin) | ✅ |
| 2 | **Property Listings** — CRUD, multi-image, documents, status approval | ✅ |
| 3 | **Smart Search** — Filter by city, budget, BHK, furnished, keyword | ✅ |
| 4 | **AI Property Recommendation** — Scored by budget, proximity, lifestyle | ✅ |
| 5 | **Property Price Prediction** ⭐⭐⭐⭐⭐ — Random Forest ML model | ✅ |
| 6 | **Investment Analysis** ⭐⭐⭐⭐⭐ — 1Y/3Y/5Y forecast, ROI%, AI rating | ✅ |
| 7 | **Loan EMI Calculator** — Sliders, amortization, principal/interest chart | ✅ |
| 8 | **Interactive Map** — Leaflet + facility radius (metro, school, hospital) | ✅ |
| 9 | **Crime Safety Analysis** — AI safety score, zone classification | ✅ |
| 10 | **Nearby Facilities** — Schools, hospitals, ATMs, restaurants, metro | ✅ |
| 11 | **Property Comparison** — Side-by-side: price, ROI, EMI, safety | ✅ |
| 12 | **Wishlist** — Save/unsave with LocalStorage + heart toggle | ✅ |
| 13 | **Real-Time Chat** — Buyer ↔ Seller with Socket.IO + ChatModal | ✅ |
| 14 | **Admin Dashboard** — Approve/reject listings, platform metrics | ✅ |
| 15 | **Analytics Dashboard** — Recharts: price trends, city distribution, users | ✅ |
| 16 | **AI Chatbot** — NLP property finder floating widget | ✅ |

---

## 🏃 How to Run

### Step 1 — Python ML Service

```bash
cd ml-service

# Install Python dependencies (use a virtualenv recommended)
pip install -r requirements.txt

# Train the Random Forest model (generates dataset.csv + model.pkl)
python train.py

# Start the FastAPI ML service on port 8000
uvicorn app:app --reload --port 8000
```
✅ ML Service running at: http://localhost:8000  
✅ API Docs (Swagger): http://localhost:8000/docs

---

### Step 2 — Node.js Backend

```bash
cd backend

# Install dependencies
npm install

# Start backend server on port 5000
npm run dev
```
✅ Backend running at: http://localhost:5000  
✅ Health check: http://localhost:5000/api/health

> **MongoDB is optional.** The backend automatically falls back to an in-memory seed dataset if MongoDB is not running — perfect for demo and development.

---

### Step 3 — React Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev
```
✅ Frontend running at: http://localhost:3000

---

## 🔑 Demo Credentials (Quick Login)

| Role | Email | Password |
|---|---|---|
| **Buyer** | buyer@realestateai.com | buyer123 |
| **Seller** | seller@realestateai.com | seller123 |
| **Admin** | admin@realestateai.com | admin123 |

> On the Login page, click the quick-fill **Buyer / Seller / Admin** buttons for one-click demo login.

---

## 🏙️ Supported Cities

| City | Key Localities | Avg Price/sqft |
|---|---|---|
| Bhopal | MP Nagar, Arera Colony, Kolar Road, Hoshangabad Road | ₹3,000–6,500 |
| Indore | Vijay Nagar, Palasia, AB Road, Bypass Road | ₹3,500–7,500 |
| Bengaluru | Indiranagar, Koramangala, Whitefield, HSR Layout | ₹6,500–16,000 |
| Mumbai | Bandra West, Andheri East, Powai, Thane | ₹12,000–38,000 |
| Delhi | Dwarka, Vasant Kunj, Rohini, South Extension | ₹7,500–22,000 |

---

## 🧠 ML Model Details

- **Algorithm:** Random Forest Regressor (100 estimators, max depth 15)
- **Training Data:** 1,500 synthetic Indian real estate records with realistic price distributions per city
- **Features:** area_sqft, bedrooms, bathrooms, age_years, parking, floor, furnished_code, crime_score, school_dist_m, hospital_dist_m, metro_dist_m + one-hot encoded city & location
- **Target:** price_lakhs
- **Typical R² Score:** 0.92–0.96
- **Fallback:** Formula-based prediction if model.pkl not found

---

## 🔌 API Endpoints

### Node Backend (`localhost:5000`)
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/properties` | List/filter properties |
| POST | `/api/properties` | Add new property (Seller) |
| GET | `/api/properties/:id` | Get property details |
| POST | `/api/ai/predict-price` | ML price prediction proxy |
| POST | `/api/ai/investment-analysis` | ROI analysis proxy |
| POST | `/api/ai/recommend` | AI recommendations proxy |
| POST | `/api/ai/chat` | AI chatbot proxy |
| GET | `/api/admin/dashboard` | Admin metrics (Admin only) |
| PATCH | `/api/admin/property/:id/status` | Approve/reject listing |
| GET | `/api/analytics` | Market analytics data |
| GET | `/api/chat` | Get messages |
| POST | `/api/chat/send` | Send message |

### ML Service (`localhost:8000`)
| Method | Route | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/predict-price` | Random Forest price prediction |
| POST | `/investment-analysis` | 1Y/3Y/5Y ROI projections |
| POST | `/recommend-properties` | AI property recommendations |
| POST | `/ai-chat` | NLP chatbot response |
| GET | `/crime-data?city=Bhopal` | City crime & safety score |

---

## 👨‍💼 About This Project

Built as a **major academic and industry-grade project** demonstrating:
- Full-stack MERN development with Python microservice integration
- Machine Learning integration (training + serving via REST API)
- Real-time communication (Socket.IO)
- Geospatial visualization (Leaflet maps)
- Role-Based Access Control (RBAC)
- Modern UI/UX with glassmorphism, micro-animations, dark design system
