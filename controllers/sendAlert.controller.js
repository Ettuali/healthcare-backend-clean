// D:\Backend\day2day-backend\controllers\sendAlert.controller.js

const SendAlert = require("../models/sendAlert.model");
const User = require("../models/user.model");
const cryptoService = require("../services/crypto.service");
const { sendNotification } = require("../services/notification.service");

const sendAlertController = {

    // =========================================================
    // CREATE — PATIENT ALERT
    // =========================================================
    sendAlertForPatient: async (req, res) => {
        try {
            const decryptedCoachId = req.body.coachId
                ? await cryptoService.decrypt(req.body.coachId, 'authentication')
                : null;

            if (req.body.coachId && isNaN(parseInt(decryptedCoachId))) {
                return res.status(400).json({ message: "Invalid Coach ID format after decryption." });
            }

            const alertData = {
                userId: req.body.userId,
                coachId: decryptedCoachId,
                doctorId: req.body.doctorId || null,
                description: req.body.description,
                severity: req.body.severity,
                status: "pending",
            };

            if (!alertData.userId || !alertData.description) {
                return res.status(400).json({ message: "Missing required fields: userId or description." });
            }

            const newAlert = await SendAlert.createAlert(alertData);

            // ----- Fetch patient contact info via model -----
           const patient = await User.getContactById(alertData.userId);

if (patient) {
    const notificationResults = await sendNotification({
        userId: patient.id,
        email: patient.email,
        phone: patient.phone,
        subject: "Medical Alert",
        message: `Alert Severity: ${alertData.severity}\n\nMessage:\n${alertData.description}`,
        channels: ["email", "sms", "whatsapp", "inapp"],
        type: "medical_alert",
        referenceType: "alert",
        referenceId: newAlert.id,
        metadata: {
            alertId: newAlert.id,
            patientId: alertData.userId,
            severity: alertData.severity,
            description: alertData.description,   // ← ADDED
        },
        templateData: {                            // ← ADDED whole block
            name: patient.name,
            severity: alertData.severity,
            description: alertData.description,
        },
    });

    console.log("NOTIFICATION RESULTS (patient):", notificationResults);
}

            res.status(201).json({
                message: "Alert sent successfully for patient.",
                alertId: newAlert.id,
            });
        } catch (error) {
            console.error("FULL ERROR:", error);
            console.error("MESSAGE:", error.message);
            console.error("STACK:", error.stack);
            res.status(500).json({ message: error.message });
        }
    },

    // =========================================================
    // CREATE — DOCTOR ALERT
    // =========================================================
    sendAlertForDoctor: async (req, res) => {
        try {
            const decryptedCoachId = req.body.coachId
                ? await cryptoService.decrypt(req.body.coachId, 'authentication')
                : null;

            if (req.body.coachId && isNaN(parseInt(decryptedCoachId))) {
                return res.status(400).json({ message: "Invalid Coach ID format after decryption." });
            }

            const alertData = {
                userId: req.body.userId || null,
                coachId: decryptedCoachId,
                doctorId: req.body.doctorId,
                description: req.body.description,
                severity: req.body.severity,
                status: "pending",
            };

            if (!alertData.doctorId || !alertData.description) {
                return res.status(400).json({ message: "Missing required fields: doctorId or description." });
            }

            const newAlert = await SendAlert.createAlert(alertData);

            // ----- Notify doctor (mirrors patient flow) -----
            const doctor = await User.getContactById(alertData.doctorId);

if (doctor) {
    const notificationResults = await sendNotification({
        userId: doctor.id,
        email: doctor.email,
        phone: doctor.phone,
        subject: "Medical Alert",
        message: `Alert Severity: ${alertData.severity}\n\nMessage:\n${alertData.description}`,
        channels: ["email", "sms", "whatsapp", "inapp"],
        type: "medical_alert",
        referenceType: "alert",
        referenceId: newAlert.id,
        metadata: {
            alertId: newAlert.id,
            doctorId: alertData.doctorId,
            severity: alertData.severity,
            description: alertData.description,   // ← ADDED
        },
        templateData: {                            // ← ADDED whole block
            name: doctor.name,
            severity: alertData.severity,
            description: alertData.description,
        },
    });

    console.log("NOTIFICATION RESULTS (doctor):", notificationResults);
}

            res.status(201).json({
                message: "Alert sent successfully for doctor.",
                alertId: newAlert.id,
            });
        } catch (error) {
            console.error("Error sending alert for doctor:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    // =========================================================
    // LISTS
    // =========================================================
    getAllAlerts: async (req, res) => {
        try {
            const { page = 0, limit = 10, search = '', sort = 'raisedOn', order = 'DESC' } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);

            const { data, totalCount } = await SendAlert.getAllAlerts({
                page: pageNum, limit: limitNum, search, sort, order
            });

            res.status(200).json({ data, totalCount, page: pageNum, limit: limitNum });
        } catch (error) {
            console.error("Error fetching all alerts:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getAlertsByPatientId: async (req, res) => {
        try {
            const { patientId } = req.params;
            const { page = 0, limit = 10, search = '', sort = 'raisedOn', order = 'DESC' } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);

            const { data, totalCount } = await SendAlert.getAlertByPatientId(
                patientId,
                { page: pageNum, limit: limitNum, search, sort, order }
            );

            res.status(200).json({ data, totalCount, page: pageNum, limit: limitNum });
        } catch (error) {
            console.error("Error fetching alerts by patient ID:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getAlertsByDoctorId: async (req, res) => {
        try {
            const { doctorId } = req.params;
            const { page = 0, limit = 10, search = '', sort = 'raisedOn', order = 'DESC' } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);

            const { data, totalCount } = await SendAlert.getAlertByDoctorId(
                doctorId,
                { page: pageNum, limit: limitNum, search, sort, order }
            );

            res.status(200).json({ data, totalCount, page: pageNum, limit: limitNum });
        } catch (error) {
            console.error("Error fetching alerts by doctor ID:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getAlertsByCoachId: async (req, res) => {
        try {
            const { coachId } = req.params;
            const { page = 0, limit = 10, search = '', sort = 'raisedOn', order = 'DESC' } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);

            const { data, totalCount } = await SendAlert.getAlertByCoachId(
                coachId,
                { page: pageNum, limit: limitNum, search, sort, order }
            );

            res.status(200).json({ data, totalCount, page: pageNum, limit: limitNum });
        } catch (error) {
            console.error("Error fetching alerts by coach ID:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    // =========================================================
    // DECRYPTED LISTS
    // =========================================================
    getAlertsByPatientIdDecrypted: async (req, res) => {
        try {
            const { patientId } = req.params;
            const { page = 0, limit = 10, search = '', sort = 'raisedOn', order = 'DESC' } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);

            const decryptedPatientId = await cryptoService.decrypt(patientId, 'authentication');

            const { data: alerts, totalCount } = await SendAlert.getAlertByPatientId(
                decryptedPatientId,
                { page: pageNum, limit: limitNum, search, sort, order }
            );

            res.status(200).json({
                data: alerts,
                totalCount,
                page: pageNum,
                limit: limitNum
            });
        } catch (error) {
            console.error("Error fetching alerts by decrypted patient ID:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getAlertsByCoachIdDecrypted: async (req, res) => {
        try {
            const { coachId } = req.params;
            const { page = 0, limit = 10, search = '', sort = 'raisedOn', order = 'DESC' } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);

            let decryptedCoachId;
            try {
                decryptedCoachId = await cryptoService.decrypt(coachId, 'authentication');
            } catch (decryptionError) {
                console.error("DECRYPTION FAILED for coachId:", coachId);
                console.error("Decryption Error Details:", decryptionError);
                return res.status(400).json({
                    message: "Invalid Coach ID provided (Decryption failed)."
                });
            }

            const { data: alerts, totalCount } = await SendAlert.getAlertByCoachId(
                decryptedCoachId,
                { page: pageNum, limit: limitNum, search, sort, order }
            );

            res.status(200).json({
                data: alerts,
                totalCount,
                page: pageNum,
                limit: limitNum
            });
        } catch (error) {
            console.error("Error fetching alerts by decrypted coach ID:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getAlertsByDoctorIdDecrypted: async (req, res) => {
        try {
            const { doctorId } = req.params;
            const { page = 0, limit = 10, search = '', sort = 'raisedOn', order = 'DESC' } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);

            const decryptedDoctorId = await cryptoService.decrypt(doctorId, 'authentication');

            const { data: alerts, totalCount } = await SendAlert.getAlertByDoctorId(
                decryptedDoctorId,
                { page: pageNum, limit: limitNum, search, sort, order }
            );

            res.status(200).json({
                data: alerts,
                totalCount,
                page: pageNum,
                limit: limitNum
            });
        } catch (error) {
            console.error("Error fetching alerts by decrypted doctor ID:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    // =========================================================
    // SINGLE ALERT, STATUS UPDATE, DELETE
    // =========================================================
    getAlertByIdDecrypted: async (req, res) => {
        try {
            const { id: encryptedId } = req.params;

            const decryptedId = await cryptoService.decrypt(
                encryptedId,
                'authentication'
            );

            const alert = await SendAlert.getAlertById(decryptedId);

            if (!alert) {
                return res.status(404).json({ message: "Alert not found." });
            }

            res.status(200).json({ data: alert });
        } catch (error) {
            console.error("Error fetching decrypted alert by ID:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    updateAlertStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, response } = req.body;

            const completedOn =
                (status === 'resolved' || status === 'closed')
                    ? new Date().toISOString().slice(0, 19).replace('T', ' ')
                    : null;

            const result = await SendAlert.changeAlertStatus(
                id,
                { status, response },
                completedOn
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: `Alert ${id} not found.` });
            }

            res.status(200).json({
                message: `Alert ${id} status updated successfully.`,
                completedOn
            });
        } catch (error) {
            console.error("Error updating alert status:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    deleteAlert: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await SendAlert.removeAlert(id);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: `Alert ${id} not found.` });
            }

            res.status(200).json({ message: `Alert ${id} deleted successfully.` });
        } catch (error) {
            console.error("Error deleting alert:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
};

module.exports = sendAlertController;