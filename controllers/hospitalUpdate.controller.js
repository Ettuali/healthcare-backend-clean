// C:\Users\nawaz\OneDrive\Desktop\DAY2DAY (2)\DAY2DAY\controllers\hospitalUpdateController.js

const hospitalUpdateModel = require("../models/hospitalUpdate.model");

const updateHospital = async (req, res) => {
    // 1. Get the hospitalId from the URL parameters
    const { id } = req.params;
    
    // 2. Get the updated data from the request body
    const updates = req.body;

    // Optional: Add a defensive check to ensure the ID is present
    if (!id) {
        return res.status(400).json({ error: "Hospital ID is required for the update operation." });
    }

    try {
        // 3. Pass the extracted ID and updates to the model function
        const rowsAffected = await hospitalUpdateModel.updateHospitalAndUser(id, updates);

        if (rowsAffected === 0) {
            return res.status(404).json({ message: "Hospital not found or no changes were made." });
        }

        res.status(200).json({ message: "Hospital and user information updated successfully." });
    } catch (error) {
        console.error("Error updating hospital and user:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

module.exports = {
    updateHospital,
};