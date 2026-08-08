const Chat = require('../models/Chat');

// Chat over REST.
//
// The Socket.IO server was removed for the Vercel migration — serverless
// functions cannot hold long-lived connections. The client now polls
// GET /api/chat?propertyId=...&since=<ms> on an interval.
//
// Storage is MongoDB when MONGO_URI is set. The in-memory array below is a
// dev-only fallback: on serverless every container has its own copy, so
// messages written to one are invisible to the next request. Set MONGO_URI in
// production.

let inMemoryMessages = [
  {
    id: 'msg-1',
    propertyId: 'prop-101',
    buyerId: 'user-buyer-101',
    sellerId: 'user-seller-102',
    senderId: 'user-seller-102',
    senderName: 'Rajesh Sharma (Seller)',
    message: 'Hello! Thank you for your interest in the MP Nagar 2BHK. Would you like to schedule a site visit this weekend?',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: 'msg-2',
    propertyId: 'prop-101',
    buyerId: 'user-buyer-101',
    sellerId: 'user-seller-102',
    senderId: 'user-buyer-101',
    senderName: 'Rahul Verma (Buyer)',
    message: 'Hi! Yes, Sunday at 11 AM works great for me. Is the price slightly negotiable?',
    timestamp: new Date(Date.now() - 1800000),
  },
];

const MAX_MESSAGE_LENGTH = 2000;
const MAX_RETURNED = 200;

function mongoReady() {
  return require('mongoose').connection.readyState === 1;
}

function normalize(doc) {
  return {
    id: doc.id || String(doc._id),
    propertyId: doc.propertyId,
    buyerId: doc.buyerId,
    sellerId: doc.sellerId,
    senderId: doc.senderId,
    senderName: doc.senderName,
    message: doc.message,
    timestamp: doc.timestamp,
  };
}

/**
 * GET /api/chat?propertyId=...&since=<epoch ms>
 *
 * `since` makes polling cheap: the client sends the timestamp of the newest
 * message it holds and gets back only what arrived after it.
 */
exports.getMessages = async (req, res) => {
  try {
    const { propertyId, since } = req.query;
    const sinceDate = since ? new Date(Number(since)) : null;
    const validSince = sinceDate && !Number.isNaN(sinceDate.getTime()) ? sinceDate : null;

    if (mongoReady()) {
      const query = {};
      if (propertyId) query.propertyId = propertyId;
      if (validSince) query.timestamp = { $gt: validSince };

      const docs = await Chat.find(query).sort({ timestamp: 1 }).limit(MAX_RETURNED).lean();
      return res.json({
        messages: docs.map(normalize),
        count: docs.length,
        server_time: Date.now(),
      });
    }

    let filtered = propertyId
      ? inMemoryMessages.filter((m) => m.propertyId === propertyId)
      : inMemoryMessages;
    if (validSince) filtered = filtered.filter((m) => m.timestamp > validSince);

    res.json({
      messages: filtered.slice(-MAX_RETURNED),
      count: filtered.length,
      server_time: Date.now(),
      persistence: 'in-memory (set MONGO_URI to persist)',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** POST /api/chat/send */
exports.sendMessage = async (req, res) => {
  try {
    const { propertyId, sellerId, message } = req.body || {};

    if (!propertyId || !message || !String(message).trim()) {
      return res.status(400).json({ message: 'propertyId and message are required' });
    }

    const text = String(message).trim().slice(0, MAX_MESSAGE_LENGTH);

    // Identity is stamped from the verified JWT, never from the request body —
    // the previous version accepted a client-supplied senderName, which let a
    // caller post under someone else's name. This route is behind
    // authMiddleware, so req.user is always present.
    const senderId = req.user.id;
    const senderName = req.user.name;

    const newMsg = {
      propertyId: String(propertyId),
      buyerId: senderId,
      sellerId: sellerId ? String(sellerId) : 'user-seller-102',
      senderId,
      senderName,
      message: text,
      timestamp: new Date(),
    };

    if (mongoReady()) {
      const saved = await Chat.create(newMsg);
      return res.status(201).json({ message: 'Message sent', chat: normalize(saved) });
    }

    const withId = { id: 'msg-' + Date.now(), ...newMsg };
    inMemoryMessages.push(withId);
    res.status(201).json({ message: 'Message sent', chat: withId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
