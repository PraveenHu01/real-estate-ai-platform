const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  propertyId: { type: String, required: true },
  buyerId: { type: String, required: true },
  sellerId: { type: String, required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);
