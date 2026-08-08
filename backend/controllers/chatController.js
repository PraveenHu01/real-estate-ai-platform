let sampleMessages = [
  {
    id: "msg-1",
    propertyId: "prop-101",
    buyerId: "user-buyer-101",
    sellerId: "user-seller-102",
    senderName: "Rajesh Sharma (Seller)",
    message: "Hello Rahul! Thank you for your interest in the MP Nagar 2BHK. Would you like to schedule a site visit this weekend?",
    timestamp: new Date(Date.now() - 3600000)
  },
  {
    id: "msg-2",
    propertyId: "prop-101",
    buyerId: "user-buyer-101",
    sellerId: "user-seller-102",
    senderName: "Rahul Verma (Buyer)",
    message: "Hi Rajesh! Yes, Sunday at 11 AM works great for me. Is the price slightly negotiable?",
    timestamp: new Date(Date.now() - 1800000)
  }
];

exports.getMessages = async (req, res) => {
  const { propertyId } = req.query;
  const filtered = propertyId ? sampleMessages.filter(m => m.propertyId === propertyId) : sampleMessages;
  res.json({ messages: filtered });
};

exports.sendMessage = async (req, res) => {
  const { propertyId, sellerId, message, senderName } = req.body;
  const buyerId = req.user ? req.user.id : 'user-buyer-101';

  const newMsg = {
    id: "msg-" + Date.now(),
    propertyId,
    buyerId,
    sellerId: sellerId || 'user-seller-102',
    senderName: senderName || (req.user ? req.user.name : 'Buyer'),
    message,
    timestamp: new Date()
  };

  sampleMessages.push(newMsg);
  res.status(201).json({ message: 'Message sent', chat: newMsg });
};
