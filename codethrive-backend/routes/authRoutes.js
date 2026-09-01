const express = require('express');
const { registerEmployee, approveEmployee, createCredentials, login, adminLogin, logout, updatePassword } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public Routes
router.post('/register-employee', registerEmployee);
router.post('/create-credentials', createCredentials);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.get('/logout', protect, logout);

// Protected Admin Routes
router.put('/approve-employee/:id', protect, authorize('superadmin', 'admin', 'hr'), approveEmployee);

// Protected Employee Routes
router.put('/updatepassword', protect, updatePassword);
router.get('/me', protect, require('../controllers/authController').getMe);

module.exports = router;
