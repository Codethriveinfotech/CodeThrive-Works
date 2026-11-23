const express = require('express');
const { getCompanyProfile, updateCompanyProfile } = require('../controllers/companyController');

const router = express.Router();

router.route('/')
  .get(getCompanyProfile)
  .put(updateCompanyProfile)
  .post(updateCompanyProfile);

module.exports = router;
