const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { loginLimiter, registerLimiter, forgotPasswordLimiter } = require('../middleware/rateLimit');

// Public
router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/mfa/verify', loginLimiter, authController.verifyMfa);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/password-strength', authController.checkPasswordStrength);

// Authenticated
router.get('/me', authMiddleware, authController.getMe);
router.post('/mfa/setup', authMiddleware, authController.setupMfa);
router.post('/mfa/enable', authMiddleware, authController.enableMfa);
router.get('/audit', authMiddleware, authController.getAuditLog);

module.exports = router;
