// routes/admin.router.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminadd.controller");
const { verifyToken } = require('../middleware/auth');

// Note: The previous code had a bug where the POST endpoint for creating an admin
// was incorrectly calling the getAllAdmins function. This has been corrected.

// POST create a new admin
router.post("/admin", verifyToken,  adminController.createAdmin);

// GET all admins
router.get("/admin", verifyToken, adminController.getAllAdmins);

// GET a specific admin by ID
router.get("/admin/:id", adminController.getAdminById);

// PUT update an admin by ID
router.put("/admin/:id", adminController.updateAdmin);

// DELETE an admin by ID
router.delete("/admin/:id", adminController.deleteAdmin);

module.exports = router;
