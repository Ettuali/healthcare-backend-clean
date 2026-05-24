const express = require("express");
const router = express.Router();
const userManagementController = require("../controllers/userManagement.controller");
const { verifyToken } = require("../middleware/auth");

// Base Path is now /api/users, so "/" refers to that.

// POST /api/users
router.post(
  "/",
  verifyToken,
  userManagementController.createUserAndHospital
);

// GET /api/users
router.get(
  "/",
  // verifyToken,
  userManagementController.getAllUsers
);

// GET /api/users/creator/:roleName
router.get(
  "/creator/:roleName",
  // verifyToken,
  userManagementController.getUsersByCreatorAndRole
);

// GET /api/users/hospital/:roleName
router.get(
  "/hospital/:roleName",
  // verifyToken,
  userManagementController.getUsersByHospital
);

// GET /api/users/:id
router.get(
  "/:id",
  // verifyToken,
  userManagementController.getUserById
);

// PUT /api/users/:id
router.put(
  "/:id",
  // verifyToken,
  userManagementController.updateUser
);

// PATCH /api/users/:id/reset-password
router.patch(
  "/:id/reset-password",
  // verifyToken,
  userManagementController.resetPassword
);

// DELETE /api/users/:id
router.delete(
  "/:id",
  // verifyToken,
  userManagementController.deactivateUser
);

// PATCH /api/users/:id/reactivate
router.patch(
  "/:id/reactivate",
  // verifyToken,
  userManagementController.reactivateUser
);

router.post("/:id/assign-package", userManagementController.assignPackage);

module.exports = router;                                                        