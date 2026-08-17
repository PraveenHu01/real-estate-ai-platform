const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', propertyController.getAllProperties);
// Literal paths must precede '/:id', or the param route captures them.
router.get('/cities', propertyController.getCities);
router.get('/localities', propertyController.getLocalities);
router.get('/wishlist', authMiddleware, propertyController.getWishlist);
router.post('/wishlist/toggle', authMiddleware, propertyController.toggleWishlist);
router.get('/:id', propertyController.getPropertyById);
router.post('/', authMiddleware, propertyController.createProperty);

module.exports = router;
