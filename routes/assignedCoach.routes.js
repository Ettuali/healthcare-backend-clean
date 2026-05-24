const express = require("express");
const router = express.Router();
const assignedCoachController = require("../controllers/assignedCoach.controller");

//  Assign a new coach
router.post("/assign", assignedCoachController.assignCoach);

//  Reassign an existing coach
router.put("/reassign/:id", assignedCoachController.reassignCoach);

//  Remove a coach assignment
router.delete("/remove/:id", assignedCoachController.removeCoach);

module.exports = router;
