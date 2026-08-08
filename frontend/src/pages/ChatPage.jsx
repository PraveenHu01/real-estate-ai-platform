import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MessageSquare, Send, User, Building, Phone, Mail } from 'lucide-react';
import api from '../services/api';

// How often to check for new messages. The backend runs as serverless
// functions, which cannot hold a WebSocket open, so this polls instead.
// Only messages newer than the last one held are transferred.
const POLL_INTERVAL_MS = 5000;

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('propertyId') || 'prop-101';
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);

  // Server clock, not the browser's — clock skew would otherwise cause
  // messages to be skipped or re-fetched forever.
  const sinceRef = useRef(null);
  const feedRef = useRef(null);

  const mergeMessages = useCallback((incoming) => {
    if (!incoming?.length) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      if (!fresh.length) return prev;
      return [...prev, ...fresh].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
    });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const params = { propertyId };
      if (sinceRef.current) params.since = sinceRef.current;

      const res = await api.get('/chat', { params });
      mergeMessages(res.data.messages);
      if (res.data.server_time) sinceRef.current = res.data.server_time;
    } catch {
      // Transient failure — the next tick retries.
    }
  }, [propertyId, mergeMessages]);

  // Reset and reload whenever the conversation changes.
  useEffect(() => {
    sinceRef.current = null;
    setMessages([]);
    fetchMessages();
  }, [propertyId, fetchMessages]);

  // Poll while the tab is visible. A hidden tab stops polling so a backgrounded
  // page does not keep burning function invocations.
  useEffect(() => {
    let timer = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(fetchMessages, POLL_INTERVAL_MS);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        fetchMessages();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchMessages]);

  // Keep the newest message in view.
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = inputMsg.trim();
    if (!text || sending) return;

    setInputMsg('');
    setSending(true);

    try {
      // The server stamps the sender from the session, so the echoed message
      // is authoritative — render that rather than a local guess.
      const res = await api.post('/chat/send', { propertyId, message: text });
      if (res.data.chat) mergeMessages([res.data.chat]);
    } catch {
      // Restore the draft so the text is not lost.
      setInputMsg(text);
    } finally {
      setSending(false);
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
        <div ref={feedRef} className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
          {messages.length === 0 && (
            <p className="text-center text-slate-500 pt-8">
              No messages yet. Start the conversation below.
            </p>
          )}
          {messages.map((m) => {
            // Compare ids, not display names — two users can share a name.
            const isMe = user && m.senderId === user.id;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
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
          <button type="submit" disabled={sending} className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center space-x-1.5">
            <Send className="w-4 h-4" />
            <span>{sending ? 'Sending...' : 'Send'}</span>
          </button>
        </form>

      </div>

    </div>
  );
}
