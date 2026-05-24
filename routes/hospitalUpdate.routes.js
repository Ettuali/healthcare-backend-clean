// routes/hospitalUpdateRoutes.js

const express = require("express");
const router = express.Router();
const hospitalUpdateController = require("../controllers/hospitalUpdate.controller");

// Define a PUT route to update a hospital by ID
router.put("/:id", hospitalUpdateController.updateHospital);


module.exports = router;
