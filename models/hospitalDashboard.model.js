const db = require("../config/db");

const Dashboard = {
  // ==========================================
  // FILTERED ANALYTICS
  // ==========================================

 getStats: async (hospitalId, fromDate, toDate) => {
  const [result] = await db.query(`
    SELECT

      -- Total Doctors (DATE FILTERED)
      (
        SELECT COUNT(DISTINCT u.id)
        FROM user u
        JOIN assignedhospital ah ON u.id = ah.userId
        JOIN userrole ur ON u.id = ur.userId
        WHERE ur.roleId = 3
          AND ah.hospitalId = ?
          AND DATE(u.createdOn) BETWEEN ? AND ?
      ) AS totalDoctors,

      -- Assigned Nurses (DATE FILTERED)
      (
        SELECT COUNT(DISTINCT pa.caretakerId)
        FROM patient_assignments pa
        JOIN user caretaker ON pa.caretakerId = caretaker.id
        JOIN assignedhospital ah ON pa.patientId = ah.userId
        WHERE ah.hospitalId = ?
          AND pa.status = 'Active'
          AND pa.caretakerId IS NOT NULL
          AND DATE(caretaker.createdOn) BETWEEN ? AND ?
      ) AS totalNurses,

      -- Total Patients (DATE FILTERED)
      (
        SELECT COUNT(DISTINCT u.id)
        FROM user u
        JOIN assignedhospital ah ON u.id = ah.userId
        JOIN userrole ur ON u.id = ur.userId
        WHERE ur.roleId = 5
          AND ah.hospitalId = ?
          AND DATE(u.createdOn) BETWEEN ? AND ?
      ) AS totalPatients,

      -- Total Specialities (DATE FILTERED)
      (
        SELECT COUNT(DISTINCT u.specialization)
        FROM user u
        JOIN userrole ur ON u.id = ur.userId
        JOIN assignedhospital ah ON u.id = ah.userId
        WHERE ur.roleId = 3
          AND ah.hospitalId = ?
          AND DATE(u.createdOn) BETWEEN ? AND ?
      ) AS totalSpecialities

  `, [
    // doctors
    hospitalId, fromDate, toDate,

    // nurses
    hospitalId, fromDate, toDate,

    // patients
    hospitalId, fromDate, toDate,

    // specialities
    hospitalId, fromDate, toDate,
  ]);

  return result[0];
},

  getGenderStats: async (hospitalId, fromDate, toDate) => {
    const [rows] = await db.query(`
      SELECT 
        u.gender, 
        COUNT(*) as count
      FROM user u
      JOIN assignedhospital ah ON u.id = ah.userId
      JOIN userrole ur ON u.id = ur.userId AND ur.roleId = 5
      WHERE ah.hospitalId = ?
        AND DATE(u.createdOn) BETWEEN ? AND ?
      GROUP BY u.gender
      ORDER BY count DESC
    `, [hospitalId, fromDate, toDate]);

    return rows;
  },

  getBloodGroupStats: async (hospitalId, fromDate, toDate) => {
    const [rows] = await db.query(`
      SELECT 
        p.bloodGroup, 
        COUNT(DISTINCT p.patientId) as count
      FROM patientvitalslogs p
      JOIN user u ON p.patientId = u.id
      JOIN assignedhospital ah ON p.patientId = ah.userId
      WHERE ah.hospitalId = ?
        AND DATE(u.createdOn) BETWEEN ? AND ?
      GROUP BY p.bloodGroup
      ORDER BY count DESC
    `, [hospitalId, fromDate, toDate]);

    return rows;
  },

  getAgeDistribution: async (hospitalId, fromDate, toDate) => {
    const [rows] = await db.query(`
      SELECT
        CASE
          WHEN u.age BETWEEN 0 AND 20 THEN '0-20'
          WHEN u.age BETWEEN 21 AND 40 THEN '21-40'
          WHEN u.age BETWEEN 41 AND 60 THEN '41-60'
          WHEN u.age BETWEEN 61 AND 80 THEN '61-80'
          ELSE '81+'
        END as ageGroup,
        COUNT(*) as count
      FROM user u
      JOIN assignedhospital ah ON u.id = ah.userId
      JOIN userrole ur ON u.id = ur.userId AND ur.roleId = 5
      WHERE ah.hospitalId = ?
        AND DATE(u.createdOn) BETWEEN ? AND ?
      GROUP BY ageGroup
      ORDER BY 
        CASE ageGroup
          WHEN '0-20' THEN 1
          WHEN '21-40' THEN 2
          WHEN '41-60' THEN 3
          WHEN '61-80' THEN 4
          ELSE 5
        END
    `, [hospitalId, fromDate, toDate]);

    return rows;
  },

getPatientsByDept: async (hospitalId, fromDate, toDate) => {
  const [rows] = await db.query(`
    SELECT 
      u_doc.specialization as departmentName, 
      COUNT(DISTINCT pa.patientId) as patientCount
    FROM patient_assignments pa
    JOIN user u_doc ON pa.doctorId = u_doc.id
    JOIN assignedhospital ah ON pa.patientId = ah.userId
    WHERE ah.hospitalId = ?
      AND pa.status = 'Active'
      AND DATE(pa.assignedOn) BETWEEN ? AND ?
    GROUP BY u_doc.specialization
    ORDER BY patientCount DESC
  `, [hospitalId, fromDate, toDate]);

  return rows;
},

  getPatientList: async (hospitalId, fromDate, toDate) => {
    const [rows] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.age,
        u.gender,
        p.bloodGroup,
        p.diagnosisType,
        p.severityLevel,
        u.phone
      FROM user u
      JOIN userrole ur ON u.id = ur.userId AND ur.roleId = 5
      JOIN assignedhospital ah ON u.id = ah.userId
      LEFT JOIN (
        SELECT pv1.*
        FROM patientvitalslogs pv1
        WHERE pv1.id IN (
          SELECT MAX(id)
          FROM patientvitalslogs
          GROUP BY patientId
        )
      ) p ON u.id = p.patientId
      WHERE ah.hospitalId = ?
        AND DATE(u.createdOn) BETWEEN ? AND ?
      ORDER BY u.createdOn DESC
      LIMIT 5
    `, [hospitalId, fromDate, toDate]);

    return rows;
  },

  // ==========================================
  // STRUCTURAL DATA
  // ==========================================

  getDoctorsByDept: async (hospitalId) => {
    const [rows] = await db.query(`
      SELECT 
        u.specialization, 
        COUNT(*) as count
      FROM user u
      JOIN userrole ur ON u.id = ur.userId
      JOIN assignedhospital ah ON u.id = ah.userId
      WHERE ur.roleId = 3 
        AND ah.hospitalId = ?
      GROUP BY u.specialization
      ORDER BY count DESC
    `, [hospitalId]);

    return rows;
  },

  // ==========================================
  // OPERATIONAL MONITORING
  // ==========================================

  getPatientActivityLast7Days: async (hospitalId) => {
    const [rows] = await db.query(`
      SELECT 
        DATE(p.createdOn) as date, 
        COUNT(*) as count
      FROM patientvitalslogs p
      JOIN assignedhospital ah ON p.patientId = ah.userId
      WHERE ah.hospitalId = ? 
        AND p.createdOn >= CURDATE() - INTERVAL 7 DAY
      GROUP BY DATE(p.createdOn)
      ORDER BY date ASC
    `, [hospitalId]);

    return rows;
  },

  // ==========================================
  // LONG TERM TRENDS
  // ==========================================

  getPatientDemographicsYearly: async (hospitalId, year) => {
    const [rows] = await db.query(`
      SELECT 
        MONTH(u.createdOn) as month,
        SUM(CASE WHEN u.gender = 'Male' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN u.gender = 'Female' THEN 1 ELSE 0 END) as female,
        SUM(CASE WHEN u.gender = 'Other' THEN 1 ELSE 0 END) as other
      FROM user u
      JOIN userrole ur ON u.id = ur.userId AND ur.roleId = 5
      JOIN assignedhospital ah ON u.id = ah.userId
      WHERE ah.hospitalId = ?
        AND YEAR(u.createdOn) = ?
      GROUP BY MONTH(u.createdOn)
      ORDER BY month ASC
    `, [hospitalId, year]);

    return rows;
  }
};

module.exports = Dashboard;