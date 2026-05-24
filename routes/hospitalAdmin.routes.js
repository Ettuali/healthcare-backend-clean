const express = require("express");
const router = express.Router();
const hospitalAdminController = require("../controllers/hospitalAdmin.controller");

// Endpoint to create a new hospital with an admin user.
router.post("/create", hospitalAdminController.addHospitalWithAdmin);



module.exports = router;
