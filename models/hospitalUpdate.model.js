const db = require("../config/db");

/**
 * Updates both the hospital and its associated user's information.
 * It fetches the user ID linked to the hospital ID before performing the updates.
 *
 * @param {string} hospitalId - The ID of the hospital to update.
 * @param {object} updates - An object containing the fields to update for both hospital and user.
 * @returns {number} The number of rows affected by the update.
 */
const updateHospitalAndUser = async (hospitalId, updates) => {
    try {
        await db.query("START TRANSACTION");

        const [assignment] = await db.query(
            `SELECT userId FROM assignedhospital WHERE hospitalId = ?`,
            [hospitalId]
        );

        if (assignment.length === 0) {
            await db.query("ROLLBACK");
            throw new Error(`User not found for hospital ID ${hospitalId}`);
        }

        const userId = assignment[0].userId;
 
        const hospitalUpdates = {};
        const userUpdates = {};

        // Mapping from frontend field names to database column names
        const fieldMapping = {
            name: { hospital: 'name', user: 'name' },
            registrationNumber: { hospital: 'registrationNumber' },
            address: { hospital: 'address' },
            contact: { hospital: 'contactNumber', user: 'phone' },
            email: { hospital: 'email', user: 'email' },
            location: { user: 'location' },
            zipcode: { hospital: 'zipcode' }
        };

        for (const key in updates) {
            if (fieldMapping[key]) {
                if (fieldMapping[key].hospital) {
                    hospitalUpdates[fieldMapping[key].hospital] = updates[key];
                }
                if (fieldMapping[key].user) {
                    userUpdates[fieldMapping[key].user] = updates[key];
                }
            }
        }

        if (Object.keys(hospitalUpdates).length > 0) {
            const hospitalUpdateQuery = `UPDATE hospital SET ? WHERE id = ?`;
            await db.query(hospitalUpdateQuery, [hospitalUpdates, hospitalId]);
        }

        if (Object.keys(userUpdates).length > 0) {
            const userUpdateQuery = `UPDATE user SET ? WHERE id = ?`;
            await db.query(userUpdateQuery, [userUpdates, userId]);
        }

        await db.query("COMMIT");
        return 1;
    } catch (error) {
        await db.query("ROLLBACK");
        console.error("Error in updateHospitalAndUser transaction:", error);
        throw error;
    }
};

module.exports = {
    updateHospitalAndUser,
};