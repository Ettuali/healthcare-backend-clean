const UserDocument = require("../models/userDocument.model");
const { minioClient, BUCKET_NAME } = require("../config/minio");
const cryptoService = require("../services/crypto.service");
const fs = require("fs");
const path = require("path");

const userDocumentController = {

  // ✅ CREATE DOCUMENT
  createDocument: async (req, res) => {
    try {
      console.log("🔥 BODY:", req.body);
      console.log("🔥 FILE:", req.file);
      console.log("🔥 USER:", req.user);

      const {
        patientUserId,
        uploaderRole,
        documentName,
        documentType,
      } = req.body;

      // ✅ Validation
      if (!patientUserId || !uploaderRole || !req.file) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // ✅ Decrypt encrypted patient ID
      let decryptedId;

      try {
        decryptedId = await cryptoService.decrypt(
          patientUserId,
          "authentication"
        );
      } catch (decryptError) {
        console.error("❌ DECRYPT ERROR:", decryptError);

        return res.status(400).json({
          success: false,
          message: "Invalid encrypted patient ID",
        });
      }

      // ✅ Convert to integer
      const parsedPatientId = parseInt(decryptedId);

      // ✅ Uploaded by logged-in user
      const uploadedBy = req.user?.id || req.user?.userId;

      // ✅ Final validation
      if (isNaN(parsedPatientId) || !uploadedBy) {
        return res.status(400).json({
          success: false,
          message: "Invalid IDs",
        });
      }

      // ✅ Local uploaded file path
      const filePath = req.file.path;

      // ✅ Generate unique filename
      const fileName = `${Date.now()}-${path.basename(req.file.originalname)}`;

      // ✅ Upload to MinIO
      await minioClient.fPutObject(
        BUCKET_NAME,
        fileName,
        filePath
      );

      // ✅ Remove local temp file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // ✅ Prepare DB object
      const documentData = {
        patientUserId: parsedPatientId,
        uploadedBy,
        uploaderRole,
        documentName: documentName || "Untitled",
        imagePath: fileName,
        documentType: documentType || "prescription",
      };

      // ✅ Save in DB
      const newDoc = await UserDocument.create(documentData);

      // ✅ Success response
      return res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        documentId: newDoc.insertId,
        data: documentData,
      });

    } catch (err) {
      console.error("❌ UPLOAD ERROR:", err);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message,
      });
    }
  },

  // ✅ COMMON HELPER
  _generatePresignedUrls: async (docs) => {
    if (!docs || docs.length === 0) return [];

    return Promise.all(
      docs.map(async (doc) => {
        if (doc.imagePath) {
          const url = await minioClient.presignedGetObject(
            BUCKET_NAME,
            doc.imagePath,
            60 * 60
          );
          return {
            ...doc,
            imageUrl: url,
          };
        }
        return doc;
      })
    );
  },

  // ✅ GET ALL (DECRYPTED)
  getDocumentsByUserId: async (req, res) => {
    try {
      const decryptedId = await cryptoService.decrypt(
        req.params.userId,
        "authentication"
      );

      const docs = await UserDocument.getByPatientId(decryptedId);
      const result = await userDocumentController._generatePresignedUrls(docs);

      res.json({ success: true, data: result });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // ✅ GET ALL (RAW)
  getDocumentsUserId: async (req, res) => {
    try {
      const docs = await UserDocument.getByPatientId(req.params.userId);
      const result = await userDocumentController._generatePresignedUrls(docs);

      res.json({ success: true, data: result });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // ✅ GET BY TYPE (DECRYPTED)
  Useren: async (req, res) => {
    try {
      const decryptedId = await cryptoService.decrypt(
        req.params.userId,
        "authentication"
      );

      const docs = await UserDocument.getByPatientIdAndType(
        decryptedId,
        req.params.documentType
      );

      const result = await userDocumentController._generatePresignedUrls(docs);

      res.json({ success: true, data: result });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // ✅ GET BY TYPE (RAW)
  Userdec: async (req, res) => {
    try {
      const docs = await UserDocument.getByPatientIdAndType(
        req.params.userId,
        req.params.documentType
      );

      const result = await userDocumentController._generatePresignedUrls(docs);

      res.json({ success: true, data: result });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // ✅ GET LATEST (RAW)
  getLatestDocumentRaw: async (req, res) => {
    try {
      const doc = await UserDocument.getLatestByPatientIdAndType(
        req.params.userId,
        req.params.documentType
      );

      if (!doc) return res.json({ data: null });

      const url = await minioClient.presignedGetObject(
        BUCKET_NAME,
        doc.imagePath,
        60 * 60
      );

      res.json({
        success: true,
        data: {
          ...doc,
          imageUrl: url,
        },
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // ✅ GET LATEST (DECRYPTED)
  getLatestDocument: async (req, res) => {
    try {
      const decryptedId = await cryptoService.decrypt(
        req.params.userId,
        "authentication"
      );

      const doc = await UserDocument.getLatestByPatientIdAndType(
        decryptedId,
        req.params.documentType
      );

      if (!doc) return res.json({ data: null });

      const url = await minioClient.presignedGetObject(
        BUCKET_NAME,
        doc.imagePath,
        60 * 60
      );

      res.json({
        success: true,
        data: {
          ...doc,
          imageUrl: url,
        },
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

};

module.exports = userDocumentController;