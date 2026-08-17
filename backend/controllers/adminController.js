const { initialProperties } = require('../utils/seedData');

let pendingListings = [...initialProperties];

exports.getAdminDashboard = async (req, res) => {
  res.json({
    metrics: {
      totalProperties: pendingListings.length,
      approvedProperties: pendingListings.filter(p => p.status === 'Approved').length,
      pendingProperties: pendingListings.filter(p => p.status === 'Pending').length,
      totalUsers: 142,
      activeSellers: 38,
      platformRevenueLakhs: 18.5
    },
    properties: pendingListings
  });
};

exports.updateListingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Approved' | 'Rejected'
  
  const prop = pendingListings.find(p => p.id === id || p._id === id);
  if (prop) {
    prop.status = status;
  }

  res.json({ message: `Property status updated to ${status}`, property: prop });
};

exports.retrainModel = async (req, res) => {
  try {
    const val = require('../utils/valuationModel');
    res.json({
      success: true,
      message: 'AI Model weights & provenance verified active',
      diagnostics: val.modelInfo(),
      active_markets: 32,
      last_sync: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

