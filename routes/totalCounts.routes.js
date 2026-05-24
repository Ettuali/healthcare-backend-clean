// routes/totalCounts.routes.js
const express = require("express");
const router = express.Router();
const totalCountsController = require("../controllers/totalCounts.controller");

// GET all total counts in a single request
router.get("/", totalCountsController.getAllCounts);

module.exports = router;