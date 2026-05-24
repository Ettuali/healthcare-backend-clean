const express = require("express");
const router = express.Router();
const userDocumentController = require("../controllers/userDocument.controller");
const upload = require("../middleware/multer.middleware");
const { verifyToken } = require("../middleware/auth");

// ✅ CREATE
router.post(
  "/create",
  verifyToken,
  upload.single("image"),
  userDocumentController.createDocument
);

// ✅ GET ALL (encrypted)
router.get(
  "/user/:userId",
  userDocumentController.getDocumentsByUserId
);

// ✅ GET ALL (raw)
router.get(
  "/users/:userId",
  userDocumentController.getDocumentsUserId
);

// ✅ GET BY TYPE (encrypted)
router.get(
  "/user/:userId/type/:documentType",
  userDocumentController.Useren
);

// ✅ GET BY TYPE (raw)
router.get(
  "/users/:userId/type/:documentType",
  userDocumentController.Userdec
);

// ✅ GET LATEST (raw)
router.get(
  "/latest/raw/:userId/type/:documentType",
  userDocumentController.getLatestDocumentRaw
);

// ✅ GET LATEST (encrypted)
router.get(
  "/latest/encrypted/:userId/type/:documentType",
  userDocumentController.getLatestDocument
);

module.exports = router;