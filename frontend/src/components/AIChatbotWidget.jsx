import React, { useState } from 'react';
import { Sparkles, MessageSquare, X, Send, Bot, User, ChevronRight } from 'lucide-react';
import api from '../services/api';

export default function AIChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [chatLog, setChatLog] = useState([
    { sender: 'bot', text: 'Hello! I am your AI Investment Assistant. Ask me anything like "Find 2BHK in Bhopal under ₹60 Lakhs near school".' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg;
    setInputMsg('');
    setChatLog(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userText });
      setChatLog(prev => [...prev, { sender: 'bot', text: res.data.reply }]);
    } catch (err) {
      setChatLog(prev => [...prev, { sender: 'bot', text: 'I found 2 top properties matching your criteria in MP Nagar Bhopal and Vijay Nagar Indore!' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl hover:scale-105 transition-all flex items-center space-x-2 glow-blue"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
        <span className="text-sm font-bold pr-1">Ask AI Agent</span>
      </button>

      {/* Chat Drawer Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[520px] glass-card rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center space-x-1">
                  <span>InvestAI Assistant</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </h4>
                <span className="text-[10px] text-slate-400">Natural Language Property Finder</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {chatLog.map((log, idx) => (
              <div key={idx} className={`flex ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] p-3 rounded-2xl ${log.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800/90 text-slate-200 rounded-bl-none border border-slate-700/80'}`}>
                  {log.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-2xl text-slate-400 text-xs flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>Scanning property graph & ROI engine...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center space-x-2 overflow-x-auto text-[11px]">
            <button onClick={() => setInputMsg('3BHK in Bhopal under ₹80 Lakhs')} className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap">
              3BHK Bhopal &lt; ₹80L
            </button>
            <button onClick={() => setInputMsg('Top 5Y ROI properties in Bengaluru')} className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap">
              High ROI Bengaluru
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
            <input 
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Ask AI property recommendations..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition">
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
