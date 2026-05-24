const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalDashboard.controller');

const { verifyToken } = require('../middleware/auth');

router.get('/summary', verifyToken, hospitalController.getDashboard);

module.exports = router;