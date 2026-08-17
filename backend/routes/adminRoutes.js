const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/dashboard', authMiddleware, roleMiddleware(['Admin']), adminController.getAdminDashboard);
router.patch('/property/:id/status', authMiddleware, roleMiddleware(['Admin']), adminController.updateListingStatus);
router.post('/retrain-model', authMiddleware, roleMiddleware(['Admin']), adminController.retrainModel);

module.exports = router;
