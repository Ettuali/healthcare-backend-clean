const express = require("express");
const router = express.Router();
const nurseController = require("../controllers/adminnurse.controller");
const { verifyToken } = require('../middleware/auth'); 

// GET all active nurses
router.get("/nurses", verifyToken, nurseController.getAllNurses);

// GET a single nurse by ID
router.get("/nurses/:id", verifyToken, nurseController.getNurseById);

// POST a new nurse (restricted to 'admin' role via verifyToken middleware)
router.post("/nurses", verifyToken, nurseController.createNurse); 

// PUT to update a nurse by ID (restricted to 'admin' role)
router.put("/nurses/:id", verifyToken, nurseController.updateNurse);

// PATCH to update a nurse's status (deactivate/activate)
router.patch("/nurses/status/:id", verifyToken, nurseController.updateNurseStatus);

// DELETE a nurse (hard delete, restricted to 'admin' role)
router.delete("/nurses/:id", verifyToken, nurseController.deleteNurse);

module.exports = router;