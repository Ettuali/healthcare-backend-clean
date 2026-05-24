const pool = require("../config/db");

class DoctorDashboardModel {
  static async getDashboardData(year, month, date, userId) {
    const startDate = `${year}-${String(month).padStart(2, "0")}-${String(
      date
    ).padStart(2, "0")} 00:00:00`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(
      date
    ).padStart(2, "0")} 23:59:59`;

    // ✅ 1. Total patients
    const [[{ totalPatients }]] = await pool.query(
      `SELECT COUNT(DISTINCT pa.patientId) AS totalPatients
       FROM patient_assignments pa
       WHERE pa.doctorId = ?`,
      [userId]
    );

    // ✅ 2. Total caretakers
    const [[{ totalCaretakers }]] = await pool.query(
      `SELECT COUNT(DISTINCT pa.caretakerId) AS totalCaretakers
       FROM patient_assignments pa
       WHERE pa.doctorId = ? AND pa.caretakerId IS NOT NULL`,
      [userId]
    );

    // ✅ 3. Patient vitals
    const [patientVitals] = await pool.query(
      `SELECT 
          up.id AS patientId,
          up.name AS patientName,
          up.gender,
          up.age,
          latest_vital.bloodGroup,
          latest_vital.severityLevel AS severityLevel,
          latest_vital.updatedOn AS lastUpdated
       FROM patient_assignments pa
       JOIN user up ON pa.patientId = up.id
       LEFT JOIN (
          SELECT 
            pv.patientId,
            pv.severityLevel,
            pv.bloodGroup,
            pv.updatedOn,
            ROW_NUMBER() OVER (PARTITION BY pv.patientId ORDER BY pv.updatedOn DESC) AS rn
          FROM patientvitalslogs pv
          WHERE pv.createdOn BETWEEN ? AND ?
       ) AS latest_vital 
       ON up.id = latest_vital.patientId AND latest_vital.rn = 1
       WHERE pa.doctorId = ?
       ORDER BY latest_vital.updatedOn DESC`,
      [startDate, endDate, userId]
    );

    // ✅ 4. Critical alerts
    const criticalAlerts = patientVitals.filter(
      (v) => v.severityLevel === "critical"
    ).length;

    // ✅ 5. Gender distribution
    const [[{ maleCount }]] = await pool.query(
      `SELECT COUNT(*) AS maleCount 
       FROM user 
       WHERE gender = 'male' 
         AND id IN (SELECT patientId FROM patient_assignments WHERE doctorId = ?)`,
      [userId]
    );

    const [[{ femaleCount }]] = await pool.query(
      `SELECT COUNT(*) AS femaleCount 
       FROM user 
       WHERE gender = 'female' 
         AND id IN (SELECT patientId FROM patient_assignments WHERE doctorId = ?)`,
      [userId]
    );

    // ✅ 6. Age distribution
    const [ageDistribution] = await pool.query(
      `SELECT 
        CASE
          WHEN age BETWEEN 0 AND 20 THEN '1-20'
          WHEN age BETWEEN 21 AND 40 THEN '21-40'
          WHEN age BETWEEN 41 AND 60 THEN '41-60'
          WHEN age BETWEEN 61 AND 80 THEN '61-80'
          ELSE '80+'
        END AS ageGroup,
        COUNT(*) AS count
      FROM user
      WHERE id IN (SELECT patientId FROM patient_assignments WHERE doctorId = ?)
      GROUP BY ageGroup`,
      [userId]
    );

    // ✅ 7. Pending issues
    const [[{ pendingIssues }]] = await pool.query(
      `SELECT COUNT(*) AS pendingIssues
       FROM raisedissues
       WHERE doctorId = ? 
         AND status != 'completed'
         AND raisedOn BETWEEN ? AND ?`,
      [userId, startDate, endDate]
    );

    // =========================
    // ✅ 8. ALERTS (FIXED)
    // =========================
    const [alerts] = await pool.query(
      `SELECT 
        ri.id,
        ri.userId,
        ri.severity,
        ri.status,
        ri.description,
        ri.raisedOn,
        u_patient.name AS patientName,
        u_coach.name AS coachName,
        u_doctor.name AS doctorName
      FROM raisedissues ri
      LEFT JOIN user u_patient ON ri.userId = u_patient.id
      LEFT JOIN user u_coach ON ri.coachId = u_coach.id
      LEFT JOIN user u_doctor ON ri.doctorId = u_doctor.id
      WHERE ri.doctorId = ?
      ORDER BY ri.raisedOn DESC
      LIMIT 10`,
      [userId]
    );

    const formattedAlerts = alerts.map((a) => ({
      id: a.id,
      severity: a.severity,
      status: a.status,
      description: a.description,
      raisedOn: a.raisedOn,
      coachName: a.coachName,
      doctorName: a.doctorName,
      patientName: a.patientName,
    }));

    const recentAlerts = formattedAlerts.slice(0, 3);

    const alertsReceived = formattedAlerts.length;

    const pendingAlerts = formattedAlerts.filter(
      (a) => a.status && a.status.toLowerCase() !== "completed"
    ).length;

    // =========================
    // ✅ 9. Blood group distribution
    // =========================
    const [bloodGroupDistribution] = await pool.query(
      `SELECT bloodGroup, COUNT(*) AS count
       FROM patientvitalslogs
       WHERE patientId IN (
         SELECT patientId FROM patient_assignments WHERE doctorId = ?
       )
       GROUP BY bloodGroup`,
      [userId]
    );

    // =========================
    // ✅ FINAL RESPONSE
    // =========================
    return {
      stats: {
        totalPatients: totalPatients || 0,
        totalCaretakers: totalCaretakers || 0,
        criticalAlerts,
        alertsReceived,
        pendingAlerts,
        pendingIssues: pendingIssues || 0,
      },
      charts: {
        genderDistribution: [
          { gender: "Male", count: maleCount || 0 },
          { gender: "Female", count: femaleCount || 0 },
        ],
        ageDistribution,
        bloodGroupDistribution: bloodGroupDistribution || [],
      },
      alerts: {
        recentAlerts,
      },
      patientVitals,
    };
  }
}

module.exports = DoctorDashboardModel;