const express = require("express");
const router = express.Router();

const assignHospitalController = require("../controllers/assignHospital.controller");

// POST /api/assignhospital/create
router.post("/create", assignHospitalController.createAssignment);

// GET /api/assignhospital/all
router.get("/all", assignHospitalController.getAllAssignments);

// GET /api/assignhospital/user/:userId
router.get("/user/:userId", assignHospitalController.getAssignmentByUserId);

// DELETE /api/assignhospital/:id
router.delete("/:id", assignHospitalController.deleteAssignment);

module.exports = router;
 