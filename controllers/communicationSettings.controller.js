// controllers/communicationSettings.controller.js
const CommunicationSettings = require("../models/communicationSettings.model");

const communicationSettingsController = {
  list: async (req, res) => {
    try {
      const data = await CommunicationSettings.getAll();
      res.status(200).json({ data });
    } catch (error) {
      console.error("Error listing communication settings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getOne: async (req, res) => {
    try {
      const row = await CommunicationSettings.getById(req.params.id);
      if (!row) return res.status(404).json({ message: "Setting not found." });
      res.status(200).json({ data: row });
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  create: async (req, res) => {
    try {
      const { eventType, channel, enabled, providerId, templateId } = req.body;
      if (!eventType || !channel) {
        return res
          .status(400)
          .json({ message: "eventType and channel are required." });
      }
      const result = await CommunicationSettings.create({
        eventType,
        channel,
        enabled,
        providerId,
        templateId,
      });
      res.status(201).json({ message: "Setting created.", id: result.id });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({
            message: "A setting for this eventType + channel already exists.",
          });
      }
      console.error("Error creating setting:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  update: async (req, res) => {
    try {
      const result = await CommunicationSettings.update(
        req.params.id,
        req.body,
      );
      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "Setting not found or no changes." });
      }
      res.status(200).json({ message: "Setting updated." });
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  remove: async (req, res) => {
    try {
      const result = await CommunicationSettings.remove(req.params.id);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Setting not found." });
      }
      res.status(200).json({ message: "Setting deleted." });
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Convenience endpoint: toggle enabled on/off in one call (handy for UI switches)
  toggle: async (req, res) => {
    try {
      const row = await CommunicationSettings.getById(req.params.id);
      if (!row) return res.status(404).json({ message: "Setting not found." });
      const newEnabled = row.enabled ? 0 : 1;
      await CommunicationSettings.update(req.params.id, {
        enabled: newEnabled,
      });
      res.status(200).json({ message: "Toggled.", enabled: newEnabled });
    } catch (error) {
      console.error("Error toggling setting:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = communicationSettingsController;
