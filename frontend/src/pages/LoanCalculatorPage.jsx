import React from 'react';
import EMICalculator from '../components/EMICalculator';

export default function LoanCalculatorPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white">Home Loan EMI &amp; Financial Calculator</h1>
        <p className="text-xs text-slate-400">Calculate monthly mortgage payments, down payment ratios, and cumulative interest</p>
      </div>

      <EMICalculator defaultPropertyPriceLakhs={75} />
    </div>
  );
}
