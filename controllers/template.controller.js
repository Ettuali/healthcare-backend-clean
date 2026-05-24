// controllers/template.controller.js
const Template = require("../models/template.model");
const { render } = require("../services/template.engine");

const templateController = {
    list: async (req, res) => {
        try {
            res.status(200).json({ data: await Template.getAll() });
        } catch (e) { console.error(e); res.status(500).json({ message: "Internal server error" }); }
    },
    getOne: async (req, res) => {
        try {
            const row = await Template.getById(req.params.id);
            if (!row) return res.status(404).json({ message: "Template not found." });
            res.status(200).json({ data: row });
        } catch (e) { console.error(e); res.status(500).json({ message: "Internal server error" }); }
    },
    create: async (req, res) => {
        try {
            const { name, type, channel, body } = req.body;
            if (!name || !type || !channel || !body) {
                return res.status(400).json({ message: "name, type, channel, body are required." });
            }
            const result = await Template.create(req.body);
            res.status(201).json({ message: "Template created.", id: result.id });
        } catch (e) {
            if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Template for type+channel already exists." });
            console.error(e); res.status(500).json({ message: "Internal server error" });
        }
    },
    update: async (req, res) => {
        try {
            const result = await Template.update(req.params.id, req.body);
            if (result.affectedRows === 0) return res.status(404).json({ message: "Template not found or no changes." });
            res.status(200).json({ message: "Template updated." });
        } catch (e) { console.error(e); res.status(500).json({ message: "Internal server error" }); }
    },
    remove: async (req, res) => {
        try {
            const result = await Template.remove(req.params.id);
            if (result.affectedRows === 0) return res.status(404).json({ message: "Template not found." });
            res.status(200).json({ message: "Template deleted." });
        } catch (e) { console.error(e); res.status(500).json({ message: "Internal server error" }); }
    },
    // Live preview for the admin UI: POST { sampleData } → returns rendered output
    preview: async (req, res) => {
        try {
            const row = await Template.getById(req.params.id);
            if (!row) return res.status(404).json({ message: "Template not found." });
            const sampleData = req.body.sampleData || {};
            res.status(200).json({
                subject: row.subject ? render(row.subject, sampleData) : null,
                body: render(row.body, sampleData),
            });
        } catch (e) { console.error(e); res.status(500).json({ message: "Internal server error" }); }
    },
};

module.exports = templateController;