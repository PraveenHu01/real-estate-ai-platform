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
