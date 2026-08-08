import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MessageSquare, Send, User, Building, Phone, Mail } from 'lucide-react';
import api from '../services/api';

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('propertyId') || 'prop-101';
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([
    {
      id: "msg-1",
      senderName: "Rajesh Sharma (Seller)",
      message: "Hello! Thank you for your interest in the MP Nagar 2BHK. Would you like to schedule a site visit this weekend?",
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "msg-2",
      senderName: "Rahul Verma (Buyer)",
      message: "Hi Rajesh! Yes, Sunday at 11 AM works great for me. Is the price negotiable?",
      timestamp: new Date(Date.now() - 1800000).toISOString()
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  useEffect(() => {
    fetchMessages();
  }, [propertyId]);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/chat', { params: { propertyId } });
      if (res.data.messages?.length > 0) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      // Fallback
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsgObj = {
      id: "msg-" + Date.now(),
      senderName: user ? `${user.name} (${user.role})` : 'Buyer',
      message: inputMsg,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsgObj]);
    setInputMsg('');

    try {
      await api.post('/chat/send', {
        propertyId,
        message: inputMsg,
        senderName: newMsgObj.senderName
      });
    } catch (err) {
      // Fallback
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Buyer ↔ Seller Direct Chat</h1>
          <p className="text-xs text-slate-400">Property Inquiry Channel (Property ID: {propertyId})</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl h-[550px] flex flex-col overflow-hidden border border-slate-800">
        
        {/* Messages Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
          {messages.map((m, idx) => {
            const isMe = m.senderName.includes(user?.name || 'Buyer');
            return (
              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-4 rounded-2xl space-y-1 ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-900 text-slate-200 rounded-bl-none border border-slate-800'}`}>
                  <span className="block text-[10px] font-bold text-slate-300 opacity-90">{m.senderName}</span>
                  <p className="text-xs leading-relaxed">{m.message}</p>
                  <span className="block text-[9px] text-right opacity-60 pt-1">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-800 flex items-center space-x-3">
          <input 
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Type your message to seller or buyer..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <button type="submit" className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center space-x-1.5">
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>

      </div>

    </div>
  );
}
