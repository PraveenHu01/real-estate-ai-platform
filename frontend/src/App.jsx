import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIChatbotWidget from './components/AIChatbotWidget';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailsPage from './pages/PropertyDetailsPage';
import AddPropertyPage from './pages/AddPropertyPage';
import AIRecommendationsPage from './pages/AIRecommendationsPage';
import PricePredictorPage from './pages/PricePredictorPage';
import InvestmentAnalysisPage from './pages/InvestmentAnalysisPage';
import ComparePage from './pages/ComparePage';
import WishlistPage from './pages/WishlistPage';
import LoanCalculatorPage from './pages/LoanCalculatorPage';
import ChatPage from './pages/ChatPage';
import AdminDashboard from './pages/AdminDashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MfaSetupPage from './pages/MfaSetupPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WishlistProvider>
          <Router>
            <div className="min-h-screen flex flex-col transition-colors duration-200">
              <Navbar />

            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/properties" element={<PropertiesPage />} />
                <Route path="/property/:id" element={<PropertyDetailsPage />} />
                <Route path="/add-property" element={<AddPropertyPage />} />
                <Route path="/ai-recommendations" element={<AIRecommendationsPage />} />
                <Route path="/price-predictor" element={<PricePredictorPage />} />
                <Route path="/investment-analysis" element={<InvestmentAnalysisPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/emi-calculator" element={<LoanCalculatorPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />

                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/mfa-setup" element={<ProtectedRoute><MfaSetupPage /></ProtectedRoute>} />

                <Route path="/admin" element={<ProtectedRoute requiredRole="Admin"><AdminDashboard /></ProtectedRoute>} />
              </Routes>
            </main>

            <Footer />

            {/* Floating AI Chatbot Widget - available everywhere */}
            <AIChatbotWidget />
          </div>
        </Router>
      </WishlistProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
