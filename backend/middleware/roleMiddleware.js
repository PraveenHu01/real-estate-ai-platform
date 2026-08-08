const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Role hierarchy: Guest(0) < Buyer(1) < Seller(2) < Agent(3) < Admin(4)
    const HIERARCHY = { Guest: 0, Buyer: 1, Seller: 2, Agent: 3, Admin: 4 };
    const userLevel = HIERARCHY[req.user.role] ?? -1;
    const required = Math.min(...allowedRoles.map(r => HIERARCHY[r] ?? 999));

    if (userLevel < required) {
      return res.status(403).json({
        message: `Access denied. Requires one of: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_ROLE',
      });
    }
    next();
  };
};

module.exports = roleMiddleware;
