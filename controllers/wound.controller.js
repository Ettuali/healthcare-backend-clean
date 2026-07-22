const Wound = require("../models/wound.model");
const { minioClient, BUCKET_NAME } = require("../config/minio");
const cryptoService = require("../services/crypto.service");
const fs = require("fs");
const path = require("path");

// Decrypt userId if it’s encrypted
async function resolveUserId(userId) {
  if (/^\d+$/.test(userId)) return userId;
  return await cryptoService.decrypt(userId, "authentication");
}

// Generate presigned URL from MinIO
async function generatePresignedUrl(imagePath) {
  if (!imagePath) return null;

  const url = await minioClient.presignedGetObject(
    BUCKET_NAME,
    imagePath,
    60 * 60
  );

return url.replace(
  /^http:\/\/(localhost|127\.0\.0\.1):9000/,
  process.env.MINIO_PUBLIC_URL
);

}

const woundController = {
  createWoundEntry: async (req, res) => {
    try {
      if (!req.body.userId || !req.file) {
        return res.status(400).json({ message: "User ID and image are required." });
      }

      const decryptedUserId = await resolveUserId(req.body.userId);
      const fileName = path.basename(req.file.path);

      // Upload to MinIO
      await minioClient.fPutObject(BUCKET_NAME, fileName, req.file.path);
      fs.unlinkSync(req.file.path); // Remove local file

      const woundData = {
        userId: decryptedUserId,
        documentName: req.body.documentName || "Wound Image",
        imagePath: fileName,
        woundMeasurement: req.body.woundMeasurement || null,
        createdBy: decryptedUserId,
        updatedBy: decryptedUserId,
      };

      const newWound = await Wound.create(woundData);
      const imageUrl = await generatePresignedUrl(fileName);

      res.status(201).json({
        message: "Wound uploaded successfully",
        woundId: newWound.insertId,
        data: { ...woundData, imageUrl },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  fetchAllWounds: async (req, res) => {
    try {
      const wounds = await Wound.getAll();
      const woundsWithUrls = await Promise.all(
        wounds.map(async (w) => ({ ...w, imageUrl: await generatePresignedUrl(w.imagePath) }))
      );
      res.json({ data: woundsWithUrls });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  fetchWoundsByUserId: async (req, res) => {
    try {
      const decryptedUserId = await resolveUserId(req.params.userId);
      const wounds = await Wound.getByUserId(decryptedUserId);
      const woundsWithUrls = await Promise.all(
        wounds.map(async (w) => ({ ...w, imageUrl: await generatePresignedUrl(w.imagePath) }))
      );
      res.json({ data: woundsWithUrls });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  fetchLatestWoundEntry: async (req, res) => {
  try {
    const decryptedUserId = await resolveUserId(req.params.userId);

    const wound = await Wound.getLatestByUserId(decryptedUserId);

    // No wound is a VALID empty state
    if (!wound) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    wound.imageUrl = await generatePresignedUrl(
      wound.imagePath
    );

    return res.status(200).json({
      success: true,
      data: wound,
    });

  } catch (err) {
    console.error("Fetch latest wound error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
},

  updateWoundFeedback: async (req, res) => {
    try {
      const { woundId } = req.params;
      const { healingStatus, infectionSigns } = req.body;
      if (!healingStatus && infectionSigns === undefined) {
        return res.status(400).json({ message: "Healing status or infection signs required" });
      }
      const result = await Wound.updateById(woundId, { healingStatus, infectionSigns });
      if (result.affectedRows === 0) return res.status(404).json({ message: "No wound found" });
      res.json({ message: "Wound feedback updated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteWoundEntryById: async (req, res) => {
    try {
      const { woundId } = req.params;
      const result = await Wound.deleteById(woundId);
      if (result.affectedRows === 0) return res.status(404).json({ message: "No wound found" });
      res.json({ message: "Wound deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = woundController;
