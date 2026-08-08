import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function CrimeHeatMap({ crimeScore = 2.2, city = "Bhopal", location = "MP Nagar" }) {
  let safetyStatus = "Safe";
  let statusColor = "text-emerald-400";
  let statusBg = "bg-emerald-500/10 border-emerald-500/30";
  let rating = "9.2 / 10";

  if (crimeScore > 4.0) {
    safetyStatus = "Risky Zone";
    statusColor = "text-red-400";
    statusBg = "bg-red-500/10 border-red-500/30";
    rating = "6.8 / 10";
  } else if (crimeScore > 3.0) {
    safetyStatus = "Moderate";
    statusColor = "text-amber-400";
    statusBg = "bg-amber-500/10 border-amber-500/30";
    rating = "8.1 / 10";
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Neighborhood Crime & Safety Analysis</h3>
            <p className="text-xs text-slate-400">AI Safety Rating based on localized municipal crime index & patrol density</p>
          </div>
        </div>

        <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${statusBg} ${statusColor}`}>
          {safetyStatus}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Crime Meter */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-medium">Crime Index Score</span>
          <div className="text-2xl font-black text-white">{crimeScore} <span className="text-xs font-normal text-slate-400">/ 10</span></div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div style={{ width: `${(crimeScore / 10) * 100}%` }} className="bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 h-full" />
          </div>
          <span className="text-[11px] text-slate-400 block pt-1">Lower score indicates safer neighborhood</span>
        </div>

        {/* AI Safety Rating */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-medium">AI Safety Score</span>
          <div className="text-2xl font-black text-emerald-400">{rating}</div>
          <p className="text-[11px] text-slate-300">High police station proximity & 24/7 street illumination in {location}.</p>
        </div>

        {/* Security Highlights */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-medium">Safety Verification</span>
          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Gated Society Patrol</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Low Theft Index Area</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Emergency Response &lt; 8 mins</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
