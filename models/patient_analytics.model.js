// models/patient_analytics.model.js

const db = require('../config/db'); // Assuming you have a database connection pool/client setup in config/db.js

/**
 * Retrieves a comprehensive set of patient analytics data.
 * This includes:
 * 1. Gender counts and percentages, grouped by hospital, year, and month.
 * 2. Total patient counts and percentages by blood group.
 * 3. Blood group counts and percentages, grouped by hospital, year, and month.
 * @returns {Promise<Object>} A promise that resolves to an object containing all patient analytics data.
 */
async function getComprehensivePatientAnalytics() {
  // Query 1: Gender Counts, Percentages by Hospital, Year, and Month
  const genderAnalyticsQuery = `
    WITH PatientTotal AS (
        SELECT COUNT(u.id) AS totalPatients
        FROM user u
        JOIN userrole ur ON u.id = ur.userId
        JOIN roles r ON ur.roleId = r.id
        WHERE r.roleName = 'patient' AND u.gender IS NOT NULL
    )
    SELECT
        h.name AS hospitalName,
        YEAR(u.createdOn) AS registrationYear,
        MONTH(u.createdOn) AS registrationMonth,
        u.gender,
        COUNT(u.id) AS genderCount,
        -- Changed ROUND(..., 2) to ROUND(..., 0) to remove decimal places
        CONCAT(ROUND((COUNT(u.id) / PT.totalPatients) * 100, 0), '%') AS genderPercentage 
    FROM
        user u
    JOIN
       userrole ur ON u.id = ur.userId
    JOIN
        roles r ON ur.roleId = r.id
    LEFT JOIN
        assignedhospital ah ON u.id = ah.userId
    LEFT JOIN
        hospital h ON ah.hospitalId = h.id
    CROSS JOIN
        PatientTotal PT
    WHERE
        r.roleName = 'patient'
        AND u.gender IS NOT NULL
    GROUP BY
        h.name, registrationYear, registrationMonth, u.gender, PT.totalPatients
    ORDER BY
        registrationYear DESC, registrationMonth DESC, h.name, u.gender;
  `;

  // Query 2: Blood Group Counts and Percentages (Total) - Unchanged
  const bloodGroupAnalyticsQuery = `
    WITH ValidBloodGroups AS (
        SELECT DISTINCT pvl.bloodGroup
        FROM patientvitalslogs pvl
        WHERE pvl.bloodGroup IS NOT NULL
    ),
    PatientTotalByBG AS (
        SELECT COUNT(DISTINCT u.id) AS totalPatientsWithBG
        FROM user u
        JOIN userrole ur ON u.id = ur.userId
        JOIN roles r ON ur.roleId = r.id
        JOIN patientvitalslogs pvl ON u.id = pvl.patientId
        WHERE r.roleName = 'patient' AND pvl.bloodGroup IS NOT NULL
    )
    SELECT
        pvl.bloodGroup,
        COUNT(pvl.patientId) AS bloodGroupCount,
        -- Changed ROUND(..., 2) to ROUND(..., 0) to remove decimal places
        CONCAT(ROUND((COUNT(pvl.patientId) / PTBG.totalPatientsWithBG) * 100, 0), '%') AS bloodGroupPercentage
    FROM (
        -- Subquery to get the latest blood group recorded for each patient
        SELECT
            patientId,
            bloodGroup,
            createdOn,
            ROW_NUMBER() OVER (PARTITION BY patientId ORDER BY createdOn DESC) as rn
        FROM patientvitalslogs
        WHERE bloodGroup IS NOT NULL
    ) pvl
    JOIN
        user u ON pvl.patientId = u.id
    JOIN
       userrole ur ON u.id = ur.userId
    JOIN
        roles r ON ur.roleId = r.id
    CROSS JOIN
        PatientTotalByBG PTBG
    WHERE
        pvl.rn = 1 AND r.roleName = 'patient'
    GROUP BY
        pvl.bloodGroup, PTBG.totalPatientsWithBG
    ORDER BY
        bloodGroupCount DESC;
  `;

  // Query 3: Blood Group Counts, Percentages by Hospital, Year, and Month (NEW)
  const bloodGroupAnalyticsByHospitalQuery = `
    WITH HospitalPatientTotal AS (
        -- Total patients with a recorded blood group and assigned to a hospital
        SELECT 
            h.id AS hospitalId,
            COUNT(DISTINCT u.id) AS totalPatientsInHospitalWithBG
        FROM user u
        JOIN userrole ur ON u.id = ur.userId
        JOIN roles r ON ur.roleId = r.id
        JOIN assignedhospital ah ON u.id = ah.userId
        JOIN hospital h ON ah.hospitalId = h.id
        JOIN patientvitalslogs pvl ON u.id = pvl.patientId
        WHERE r.roleName = 'patient' AND pvl.bloodGroup IS NOT NULL
        GROUP BY h.id
    )
    SELECT
        h.name AS hospitalName,
        YEAR(pvl.createdOn) AS registrationYear,
        MONTH(pvl.createdOn) AS registrationMonth,
        pvl.bloodGroup,
        COUNT(pvl.patientId) AS bloodGroupCount,
        -- Calculate percentage relative to the total patients in that hospital with a blood group
        CONCAT(
            ROUND(
                (COUNT(pvl.patientId) / HPT.totalPatientsInHospitalWithBG) * 100, 
                0
            ), '%'
        ) AS bloodGroupPercentage 
    FROM (
        -- Subquery to get the latest blood group recorded for each patient
        SELECT
            patientId,
            bloodGroup,
            createdOn,
            ROW_NUMBER() OVER (PARTITION BY patientId ORDER BY createdOn DESC) as rn
        FROM patientvitalslogs
        WHERE bloodGroup IS NOT NULL
    ) pvl
    JOIN
        user u ON pvl.patientId = u.id
    JOIN
       userrole ur ON u.id = ur.userId
    JOIN
        roles r ON ur.roleId = r.id
    LEFT JOIN
        assignedhospital ah ON u.id = ah.userId
    LEFT JOIN
        hospital h ON ah.hospitalId = h.id
    JOIN
        HospitalPatientTotal HPT ON h.id = HPT.hospitalId
    WHERE
        pvl.rn = 1 AND r.roleName = 'patient' AND h.name IS NOT NULL
    GROUP BY
        h.name, registrationYear, registrationMonth, pvl.bloodGroup, HPT.totalPatientsInHospitalWithBG
    ORDER BY
        registrationYear DESC, registrationMonth DESC, h.name, pvl.bloodGroup;
  `;

  try {
    const [genderAnalyticsRows] = await db.query(genderAnalyticsQuery);
    const [bloodGroupAnalyticsRows] = await db.query(bloodGroupAnalyticsQuery);
    // Execute the new query
    const [bloodGroupAnalyticsByHospitalRows] = await db.query(bloodGroupAnalyticsByHospitalQuery);
    
    // Defensive check to ensure we return arrays
    const genderAnalytics = Array.isArray(genderAnalyticsRows) ? genderAnalyticsRows : [];
    const bloodGroupAnalytics = Array.isArray(bloodGroupAnalyticsRows) ? bloodGroupAnalyticsRows : [];
    // Assign new results
    const bloodGroupAnalyticsByHospital = Array.isArray(bloodGroupAnalyticsByHospitalRows) ? bloodGroupAnalyticsByHospitalRows : [];


    return {
      genderAnalytics: genderAnalytics,
      bloodGroupAnalytics: bloodGroupAnalytics,
      bloodGroupAnalyticsByHospital: bloodGroupAnalyticsByHospital // New data added
    };
  } catch (error) {
    console.error("Error fetching patient analytics:", error);
    // Throw an error to be caught by the controller
    throw new Error("Database query failed to fetch comprehensive patient analytics.");
  }
}

module.exports = {
  getComprehensivePatientAnalytics,
};