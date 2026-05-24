const express = require("express");
const router = express.Router();
const nurseController = require("../controllers/addnurse.controller");

// POST route to add a new nurse
router.post("/nurses", nurseController.addNurse);

module.exports = router; 
