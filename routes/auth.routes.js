const express = require('express');
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const authController = require('../controllers/auth.controller');

// AUTH ROUTES
router.post('/login', authController.login);    // /api/auth/login
router.post('/logout', authController.logout);  // /api/auth/logout
router.get("/me", verifyToken, authController.getMe);
module.exports = router;
