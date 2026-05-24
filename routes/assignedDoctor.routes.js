const express = require("express");
const router = express.Router();
const assignedDoctorController = require("../controllers/assignedDoctor.controller");

//  Assign a new doctor
router.post("/assign", assignedDoctorController.assignDoctor);

//  Reassign an existing doctor
router.put("/reassign/:id", assignedDoctorController.reassignDoctor);

//  Remove a doctor assignment
router.delete("/remove/:id", assignedDoctorController.removeDoctor);

module.exports = router;
