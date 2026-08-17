const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimit');

// Applied to the whole router rather than per route so an endpoint added below
// is throttled by default instead of shipping unmetered. optionalAuth must come
// first: it populates req.user, which aiLimiter keys on, and it deliberately
// does not reject guests — these routes stay open, just metered.
router.use(optionalAuth, aiLimiter);

router.post('/predict-price', aiController.predictPrice);
router.post('/investment-analysis', aiController.investmentAnalysis);
router.post('/recommend', aiController.recommendProperties);
router.post('/chat', aiController.aiChat);

module.exports = router;
