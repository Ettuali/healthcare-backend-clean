const express = require("express");
const router = express.Router();
const userRoleController = require("../controllers/userRole.controller");

router.post("/assign", userRoleController.assignRoleToUser);
router.get("/:userId", userRoleController.getUserRoles);

module.exports = router;