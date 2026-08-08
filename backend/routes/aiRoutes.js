const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/predict-price', aiController.predictPrice);
router.post('/investment-analysis', aiController.investmentAnalysis);
router.post('/recommend', aiController.recommendProperties);
router.post('/chat', aiController.aiChat);

module.exports = router;
