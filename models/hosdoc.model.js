const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Role ID for 'doctor' based on the image you provided (roles.id = 3)
const DOCTOR_ROLE_ID = 3;

/**
 * Creates a new doctor and assigns them to the hospital of the user who is creating them.
 * @param {object} doctorData - The data for the new doctor.
 * @param {number} createdBy - The userId of the hospital admin creating the doctor.
 * @returns {Promise<number>} - The ID of the newly created doctor.
 */
const createDoctor = async (doctorData, createdBy) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    
    try {
        // Query the assignedhospital table to get the hospitalId for the createdBy user
        const [hospitalRows] = await connection.query(
            `SELECT hospitalId FROM assignedhospital WHERE userId = ?`,
            [createdBy]
        );

        if (hospitalRows.length === 0) {
            throw new Error("Hospital not found for the user creating the doctor.");
        }
        const hospitalId = hospitalRows[0].hospitalId;

        const { name, phone, email, specialization, experience, password, language, age, city, state, area, zipcode } = doctorData;
        const hashedPassword = await bcrypt.hash(password, 10);

        const [userResult] = await connection.query(
    `INSERT INTO user (name, phone, email, password, specialization, experience, language, age, city, state, area, zipcode, status, createdBy)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)`,
    [name, phone, email, hashedPassword, specialization, experience, language, age, city, state, area, zipcode, createdBy]
);
        const newUserId = userResult.insertId;

        await connection.query(
            `INSERT INTO userrole (userId, roleId) VALUES (?, ?)`,
            [newUserId, DOCTOR_ROLE_ID]
        );

        await connection.query(
            `INSERT INTO assignedhospital (userId, hospitalId) VALUES (?, ?)`,
            [newUserId, hospitalId]
        );

        await connection.commit();
        return newUserId;

    } catch (error) {
        await connection.rollback();
        console.error("Error creating doctor, rolling back:", error);
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Updates a doctor's details.
 * @param {number} doctorId - The ID of the doctor to update.
 * @param {number} adminUserId - The userId of the hospital admin performing the update.
 * @param {object} updatedData - The data to update.
 * @returns {Promise<object>} - The result of the update query.
 */
const updateDoctor = async (doctorId, adminUserId, updatedData) => {
    try {
        const [hospitalRows] = await pool.query(
            `SELECT hospitalId FROM assignedhospital WHERE userId = ?`,
            [adminUserId]
        );

        if (hospitalRows.length === 0) {
            const notFoundError = new Error("Admin user is not assigned to a hospital.");
            notFoundError.statusCode = 404;
            throw notFoundError;
        }
        const hospitalId = hospitalRows[0].hospitalId;

        const [check] = await pool.query(
            `SELECT * FROM assignedhospital WHERE userId = ? AND hospitalId = ?`,
            [doctorId, hospitalId]
        );
        if (check.length === 0) {
            const notFoundError = new Error("Doctor not found or not assigned to this hospital.");
            notFoundError.statusCode = 404;
            throw notFoundError;
        }

        const { name, phone, email, specialization, experience, language, age, city, state, area, zipcode } = updatedData;

const [result] = await pool.query(
    `UPDATE user SET
     name = ?, phone = ?, email = ?, specialization = ?, experience = ?,
     language = ?, age = ?, city = ?, state = ?, area = ?, zipcode = ?,
     updatedBy = ?
     WHERE id = ?`,
    [name, phone, email, specialization, experience, language, age, city, state, area, zipcode, adminUserId, doctorId]
);

        return result;
    } catch (error) {
        console.error("Error updating doctor:", error);
        throw error;
    }
};

/**
 * Soft-deletes a doctor by setting their status to 'Inactive'.
 * @param {number} doctorId - The ID of the doctor to deactivate.
 * @param {number} adminUserId - The userId of the hospital admin performing the deactivation.
 * @returns {Promise<object>} - The result of the update query.
 */
const deactivateDoctor = async (doctorId, adminUserId) => {
    try {
        const [hospitalRows] = await pool.query(
            `SELECT hospitalId FROM assignedhospital WHERE userId = ?`,
            [adminUserId]
        );

        if (hospitalRows.length === 0) {
            const notFoundError = new Error("Admin user is not assigned to a hospital.");
            notFoundError.statusCode = 404;
            throw notFoundError;
        }
        const hospitalId = hospitalRows[0].hospitalId;

        const [check] = await pool.query(
            `SELECT * FROM assignedhospital WHERE userId = ? AND hospitalId = ?`,
            [doctorId, hospitalId]
        );
        if (check.length === 0) {
            const notFoundError = new Error("Doctor not found or not assigned to this hospital.");
            notFoundError.statusCode = 404;
            throw notFoundError;
        }

        const [result] = await pool.query(
            `UPDATE user SET status = 'Inactive', updatedBy = ? WHERE id = ?`,
            [adminUserId, doctorId]
        );
        return result;
    } catch (error) {
        console.error("Error deactivating doctor:", error);
        throw error;
    }
};

// --------------------------------------------------------------------
// ✅ UPDATED: getDoctorsByHospitalId (FIXED SQL SYNTAX ERROR)
// --------------------------------------------------------------------

/**
 * Get all doctors assigned to a hospital based on the user ID of the person making the request, 
 * with pagination, search, and sort.
 */
const getDoctorsByHospitalId = async (
    userId,
    page = 1,
    limit = 10,
    searchTerm = '',
    sortBy = 'name'
) => {
    try {
        // 1. Get the Hospital ID for the Admin User
        const [hospitalRows] = await pool.query(
            `SELECT hospitalId FROM assignedhospital WHERE userId = ?`,
            [userId]
        );

        if (hospitalRows.length === 0) {
            // Logging an error if the Admin (ID 3) is not linked to a hospital
            console.error(`CRITICAL DATA ERROR: Admin User ID ${userId} is not assigned to a hospital.`);
            return { doctors: [], totalPages: 0, totalCount: 0 };
        }
        const hospitalId = hospitalRows[0].hospitalId;

        // 2. Base WHERE clause and parameters
        // FIX: Removed leading/trailing newlines/spaces from the template literal for cleaner SQL
        let whereClause = `WHERE ah.hospitalId = ? AND ur.roleId = ? AND u.status = 'Active'`;
        let params = [hospitalId, DOCTOR_ROLE_ID];

        // 3. Add Search term logic
        if (searchTerm) {
            whereClause += ` AND (u.name LIKE ? OR u.specialization LIKE ?)`;
            const searchPattern = `%${searchTerm}%`;
            params.push(searchPattern, searchPattern);
        }

        // 4. Define Sort Order
        const allowedSortFields = {
            name: 'u.name',
            specialization: 'u.specialization',
            email: 'u.email',
        };
        const orderBy = allowedSortFields[sortBy] || allowedSortFields.name;

        // 5. Query to get the total count of doctors (with search filter)
        // FIX: Removed leading/trailing newlines/spaces from the template literal for cleaner SQL
        const countQuery = `SELECT COUNT(u.id) AS totalCount
FROM user u
JOIN assignedhospital ah ON u.id = ah.userId
JOIN userrole ur ON u.id = ur.userId
${whereClause}`;
        
        const [countRows] = await pool.query(countQuery, params);
        const totalCount = countRows[0].totalCount;
        const totalPages = Math.ceil(totalCount / limit);

        // 6. Calculate offset for pagination
        const offset = (page - 1) * limit;

        // 7. Query to get the paginated doctor data
        // FIX: Removed leading/trailing newlines/spaces from the template literal for cleaner SQL
        const dataQuery = `SELECT
u.id,
u.name,
u.email,
u.phone,
u.specialization,
u.experience,
u.language,
u.age,
u.city,
u.state,
u.area,
u.zipcode,

COUNT(pa.id) AS patientsAssigned

FROM user u
JOIN assignedhospital ah ON u.id = ah.userId
JOIN userrole ur ON u.id = ur.userId

LEFT JOIN patient_assignments pa 
  ON pa.doctorId = u.id 
  AND pa.status = 'Active'

${whereClause}

GROUP BY u.id

ORDER BY ${orderBy} 
LIMIT ? OFFSET ?`;
        
        const dataParams = [...params, limit, offset];
        
        const [rows] = await pool.query(dataQuery, dataParams);

        return {
            doctors: rows,
            totalPages: totalPages,
            totalCount: totalCount,
        };
    } catch (error) {
        console.error("Error fetching paginated doctors by hospital ID:", error);
        throw error;
    }
};

// --------------------------------------------------------------------
// ✅ UPDATED: getDoctorsForSpecificHospital (FIXED SQL SYNTAX ERROR)
// --------------------------------------------------------------------

/**
 * Get all doctors for a specific hospitalId, with pagination, search, and sort support.
 */
const getDoctorsForSpecificHospital = async (
    hospitalId,
    page = 1,
    limit = 10,
    searchTerm = '',
    sortBy = 'name'
) => {
    try {
        // 1. Base WHERE clause and parameters
        // FIX: Removed leading/trailing newlines/spaces from the template literal for cleaner SQL
        let whereClause = `WHERE ah.hospitalId = ? AND ur.roleId = ? AND u.status = 'Active'`;
        let params = [hospitalId, DOCTOR_ROLE_ID];

        // 2. Add Search term logic
        if (searchTerm) {
            whereClause += ` AND (u.name LIKE ? OR u.specialization LIKE ?)`;
            const searchPattern = `%${searchTerm}%`;
            params.push(searchPattern, searchPattern);
        }

        // 3. Define Sort Order
        const allowedSortFields = {
            name: 'u.name',
            specialization: 'u.specialization',
            email: 'u.email',
        };
        const orderBy = allowedSortFields[sortBy] || allowedSortFields.name;

        // 4. Query to get the total count of doctors (with search filter)
        // FIX: Removed leading/trailing newlines/spaces from the template literal for cleaner SQL
        const countQuery = `SELECT COUNT(u.id) AS totalCount
FROM user u
JOIN assignedhospital ah ON u.id = ah.userId
JOIN userrole ur ON u.id = ur.userId
${whereClause}`;
        
        const [countRows] = await pool.query(countQuery, params);
        const totalCount = countRows[0].totalCount;
        const totalPages = Math.ceil(totalCount / limit);

        // 5. Calculate offset for pagination
        const offset = (page - 1) * limit;

        // 6. Query to get the paginated doctor data
        // FIX: Removed leading/trailing newlines/spaces from the template literal for cleaner SQL
       const dataQuery = `SELECT
u.id,
u.name,
u.email,
u.phone,
u.specialization,
u.experience,
u.language,
u.age,
u.city,
u.state,
u.area,
u.zipcode,

COUNT(pa.id) AS patientsAssigned

FROM user u
JOIN assignedhospital ah ON u.id = ah.userId
JOIN userrole ur ON u.id = ur.userId

LEFT JOIN patient_assignments pa 
  ON pa.doctorId = u.id 
  AND pa.status = 'Active'

${whereClause}

GROUP BY u.id

ORDER BY ${orderBy} 
LIMIT ? OFFSET ?`;
        
        const dataParams = [...params, limit, offset];
        
        const [rows] = await pool.query(dataQuery, dataParams);

        return {
            doctors: rows,
            totalPages: totalPages,
            totalCount: totalCount,
        };
    } catch (error) {
        console.error("Error fetching doctors by specific hospital ID:", error);
        throw error;
    }
};

module.exports = {
    createDoctor,
    updateDoctor,
    deactivateDoctor,
    getDoctorsByHospitalId,
    getDoctorsForSpecificHospital,
};