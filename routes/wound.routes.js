const express = require("express");
const router = express.Router();
const woundController = require("../controllers/wound.controller");
const upload = require("../middleware/multer.middleware");

console.log("✅ wound.routes.js loaded");

// ===============================
// ✅ CREATE (with image upload)
// ===============================
router.post(
  "/create",
  upload.single("woundImage"),
  woundController.createWoundEntry
);

// ===============================
// ⚠️ IMPORTANT: SPECIFIC ROUTES FIRST
// ===============================

// ✅ GET LATEST WOUND (must be above /user/:userId)
router.get(
  "/user/:userId/latest",
  woundController.fetchLatestWoundEntry
);

// ===============================
// GENERIC ROUTES
// ===============================

// ✅ GET WOUNDS BY USER
router.get(
  "/user/:userId",
  woundController.fetchWoundsByUserId
);

// ✅ GET ALL WOUNDS
router.get(
  "/",
  woundController.fetchAllWounds
);

// ===============================
// UPDATE & DELETE
// ===============================

// ✅ UPDATE FEEDBACK
router.put(
  "/update-feedback/:woundId",
  woundController.updateWoundFeedback
);

// ✅ DELETE WOUND
router.delete(
  "/:woundId",
  woundController.deleteWoundEntryById
);

module.exports = router;