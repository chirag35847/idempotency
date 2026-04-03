const express = require('express');
const router = express.Router();
const { getFlags, updateFlags } = require('../controllers/adminController');

router.get('/feature-flags', getFlags);
router.post('/feature-flags', updateFlags);

module.exports = router;
