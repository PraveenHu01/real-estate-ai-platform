import React, { useState } from 'react';
import { Calculator, DollarSign, Percent, Calendar, PieChart } from 'lucide-react';

export default function EMICalculator({ defaultPropertyPriceLakhs = 60 }) {
  const [propertyPrice, setPropertyPrice] = useState(defaultPropertyPriceLakhs);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);

  // Calculations
  const loanAmountLakhs = propertyPrice * (1 - downPaymentPct / 100);
  const loanAmountRs = loanAmountLakhs * 100000;
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;

  const emiRs = loanAmountRs > 0 && monthlyRate > 0
    ? (loanAmountRs * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    : 0;

  const totalPaymentRs = emiRs * totalMonths;
  const totalInterestRs = totalPaymentRs - loanAmountRs;

  const principalPct = Math.round((loanAmountRs / totalPaymentRs) * 100) || 50;
  const interestPct = 100 - principalPct;

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Loan EMI & Mortgage Calculator</h3>
          <p className="text-xs text-slate-400">Estimate your monthly home loan installment & interest breakdown</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Sliders Form */}
        <div className="space-y-5">
          {/* Property Price */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300">Property Cost</span>
              <span className="text-blue-400 font-bold">₹{propertyPrice} Lakhs</span>
            </div>
            <input 
              type="range" min="10" max="500" step="5"
              value={propertyPrice}
              onChange={(e) => setPropertyPrice(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Down Payment % */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300">Down Payment ({downPaymentPct}%)</span>
              <span className="text-emerald-400 font-bold">₹{((propertyPrice * downPaymentPct) / 100).toFixed(1)} Lakhs</span>
            </div>
            <input 
              type="range" min="10" max="50" step="5"
              value={downPaymentPct}
              onChange={(e) => setDownPaymentPct(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Interest Rate */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300">Interest Rate</span>
              <span className="text-amber-400 font-bold">{interestRate}% p.a.</span>
            </div>
            <input 
              type="range" min="6.5" max="14.0" step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Tenure */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300">Loan Tenure</span>
              <span className="text-purple-400 font-bold">{tenureYears} Years</span>
            </div>
            <input 
              type="range" min="5" max="30" step="1"
              value={tenureYears}
              onChange={(e) => setTenureYears(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>

        {/* Results Card */}
        <div className="bg-slate-900/90 rounded-xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Monthly Installment</span>
            <div className="text-3xl font-black text-blue-400 mt-1">
              ₹{Math.round(emiRs).toLocaleString('en-IN')} <span className="text-sm font-normal text-slate-400">/ month</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs border-y border-slate-800 py-3">
            <div>
              <span className="text-slate-400 block">Loan Amount:</span>
              <span className="font-bold text-white">₹{loanAmountLakhs.toFixed(2)} Lakhs</span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Interest:</span>
              <span className="font-bold text-amber-400">₹{(totalInterestRs / 100000).toFixed(2)} Lakhs</span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Repayment:</span>
              <span className="font-bold text-emerald-400">₹{(totalPaymentRs / 100000).toFixed(2)} Lakhs</span>
            </div>
            <div>
              <span className="text-slate-400 block">Number of EMIs:</span>
              <span className="font-bold text-white">{totalMonths} Months</span>
            </div>
          </div>

          {/* Graphical Progress Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-400">
              <span>Principal ({principalPct}%)</span>
              <span>Interest ({interestPct}%)</span>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${principalPct}%` }} className="bg-blue-500 h-full" />
              <div style={{ width: `${interestPct}%` }} className="bg-amber-500 h-full" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
