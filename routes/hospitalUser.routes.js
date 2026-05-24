// routes/hospitalUserRoutes.js

const express = require("express");
const router = express.Router();
const hospitalUserController = require("../controllers/hospitalUser.controller");

// Define a GET route for the root of this router to fetch all hospital users.
router.get("/", hospitalUserController.getHospitalUsers);

module.exports = router;
