import React, { useState, useEffect, useContext } from 'react';
import { X, Send, MessageSquare, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function ChatModal({ property, onClose }) {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      senderName: property?.seller?.name || 'Seller',
      message: `Hello! Thank you for your interest in "${property?.title}". I'm happy to answer any questions or arrange a site visit!`,
      timestamp: new Date().toISOString(),
      isOwn: false,
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputMsg.trim()) return;

    const myMsg = {
      id: `msg-${Date.now()}`,
      senderName: user?.name || 'You',
      message: inputMsg,
      timestamp: new Date().toISOString(),
      isOwn: true,
    };

    setMessages(prev => [...prev, myMsg]);
    const sentText = inputMsg;
    setInputMsg('');
    setSending(true);

    try {
      // senderName is intentionally not sent — the server stamps identity from
      // the session cookie and ignores any client-supplied name.
      await api.post('/chat/send', {
        propertyId: property?.id || property?._id || 'prop-101',
        message: sentText,
        sellerId: property?.seller?.userId || 'seller-1',
      });

      // Simulate seller auto-reply for demo
      setTimeout(() => {
        const autoReply = {
          id: `reply-${Date.now()}`,
          senderName: property?.seller?.name || 'Seller',
          message: getAutoReply(sentText),
          timestamp: new Date().toISOString(),
          isOwn: false,
        };
        setMessages(prev => [...prev, autoReply]);
      }, 1200);
    } catch (err) {
      // Offline fallback — still show auto reply
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `reply-${Date.now()}`,
          senderName: property?.seller?.name || 'Seller',
          message: getAutoReply(sentText),
          timestamp: new Date().toISOString(),
          isOwn: false,
        }]);
      }, 1200);
    } finally {
      setSending(false);
    }
  };

  const getAutoReply = (msg) => {
    const lower = msg.toLowerCase();
    if (lower.includes('visit') || lower.includes('site') || lower.includes('see')) {
      return 'Sure! You can visit any day between 10 AM – 6 PM. Saturday and Sunday slots are also available. Shall I confirm this weekend?';
    } else if (lower.includes('price') || lower.includes('negotiate') || lower.includes('discount')) {
      return 'The price is slightly negotiable for serious buyers. Can you share your best offer? We can discuss over a call too.';
    } else if (lower.includes('emi') || lower.includes('loan') || lower.includes('bank')) {
      return 'Yes, this property is approved for home loans from SBI, HDFC, and ICICI Bank. I can share the property documents for bank processing.';
    } else if (lower.includes('document') || lower.includes('papers') || lower.includes('deed')) {
      return 'All documents are ready — Ownership Deed, RERA Registration, and NOC. I can share them digitally. What email shall I use?';
    } else {
      return `Thank you for your query! This is one of our best-listed properties in ${property?.location || 'this area'}. Would you like to schedule a call to discuss further?`;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-card rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden" style={{ height: '560px' }}>

        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
              {(property?.seller?.name || 'S')[0]}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{property?.seller?.name || 'Property Seller'}</h4>
              <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                <span>Online — Verified Owner</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <a href={`tel:${property?.seller?.phone}`} className="p-2 text-slate-400 hover:text-emerald-400 transition">
              <Phone className="w-4 h-4" />
            </a>
            <a href={`mailto:${property?.seller?.email}`} className="p-2 text-slate-400 hover:text-blue-400 transition">
              <Mail className="w-4 h-4" />
            </a>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-400 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Property context banner */}
        <div className="px-4 py-2.5 bg-blue-950/40 border-b border-blue-900/30 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
            <img src={property?.images?.[0]} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{property?.title}</p>
            <p className="text-[11px] text-blue-400">₹{property?.price_lakhs} Lakhs · {property?.location}, {property?.city}</p>
          </div>
          <div className="ml-auto shrink-0 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>RERA Verified</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-3 space-y-1 ${
                msg.isOwn
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-slate-800/90 text-slate-100 rounded-bl-sm border border-slate-700/60'
              }`}>
                <span className="block text-[10px] font-bold opacity-70">{msg.senderName}</span>
                <p className="text-xs leading-relaxed">{msg.message}</p>
                <span className="block text-[9px] text-right opacity-50 pt-0.5">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-slate-800 rounded-2xl px-4 py-3 rounded-bl-sm border border-slate-700/60">
                <div className="flex space-x-1 items-center py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center space-x-2 overflow-x-auto">
          {['Schedule a visit', 'Is price negotiable?', 'Documents ready?', 'Bank loan approved?'].map(q => (
            <button
              key={q}
              onClick={() => { setInputMsg(q); }}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium whitespace-nowrap border border-slate-700 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            placeholder="Ask about this property, price, or schedule a visit..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            disabled={!inputMsg.trim()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
