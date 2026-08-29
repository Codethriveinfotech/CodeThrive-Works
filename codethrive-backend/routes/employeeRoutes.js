const express = require('express');
const { getEmployees, getEmployee, updateEmployee, deleteEmployee, addEmployee, getMe, updateMe } = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../utils/upload');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

router.route('/me')
  .get(getMe)
  .put(upload.single('profilePhoto'), updateMe);

router.route('/')
  .get(authorize('superadmin', 'admin', 'hr', 'teamlead'), getEmployees)
  .post(authorize('superadmin', 'admin', 'hr'), upload.single('profilePhoto'), addEmployee);

router.route('/:id')
  .get(getEmployee)
  .put(authorize('superadmin', 'admin', 'hr'), upload.single('profilePhoto'), updateEmployee)
  .delete(authorize('superadmin', 'admin'), deleteEmployee);

module.exports = router;
