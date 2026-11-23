const express = require('express');
const { getCompanyProfile, updateCompanyProfile, getClientNetworkInfo } = require('../controllers/companyController');

const router = express.Router();

router.get('/network-info', getClientNetworkInfo);

router.route('/')
  .get(getCompanyProfile)
  .put(updateCompanyProfile)
  .post(updateCompanyProfile);

module.exports = router;
