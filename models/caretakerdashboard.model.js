const pool = require("../config/db");

class CaretakerDashboardModel {
  static async getDashboardData(fromDate, toDate, userId) {

    // =========================
    // 1️⃣ TOTAL PATIENTS
    // =========================
    const [[{ totalPatients }]] = await pool.query(`
      SELECT COUNT(DISTINCT pv.patientId) AS totalPatients
      FROM patientvitalslogs pv
      JOIN patient_assignments pa ON pa.patientId = pv.patientId
      WHERE pa.caretakerId = ?
      AND pv.updatedOn BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
    `, [userId, fromDate, toDate]);

    // =========================
    // 2️⃣ TOTAL DOCTORS (all-time)
    // =========================
const [[{ totalDoctors }]] = await pool.query(`
  SELECT COUNT(DISTINCT pa.doctorId) AS totalDoctors
  FROM patient_assignments pa
  JOIN patientvitalslogs pv ON pv.patientId = pa.patientId
  WHERE pa.caretakerId = ?
  AND pv.updatedOn BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
`, [userId, fromDate, toDate]);

    // =========================
    // 3️⃣ PATIENT VITALS (FOR TABLE)
    // =========================
    const [patientVitals] = await pool.query(`
      SELECT 
        u.id AS patientId,
        u.name,
        u.gender,
        u.age,
        pv.temperature,
        pv.bloodPressure,
        pv.heartRate,
        pv.oxygenSaturation,
        pv.severityLevel,
        pv.bloodGroup,
        pv.updatedOn
      FROM (
        SELECT *,
          ROW_NUMBER() OVER (
            PARTITION BY patientId 
            ORDER BY updatedOn DESC, id DESC
          ) AS rn
        FROM patientvitalslogs
        WHERE updatedOn BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      ) pv
      JOIN user u ON pv.patientId = u.id
      WHERE pv.rn = 1
      AND pv.patientId IN (
        SELECT patientId FROM patient_assignments WHERE caretakerId = ?
      )
      ORDER BY pv.updatedOn DESC
      LIMIT 5
    `, [fromDate, toDate, userId]);

    // =========================
    // 4️⃣ ALL PATIENTS (FOR NEEDS ATTENTION)
    // =========================
    const [allPatients] = await pool.query(`
      SELECT 
        u.id AS patientId,
        u.name,
        pv.updatedOn
      FROM patient_assignments pa
      JOIN user u ON u.id = pa.patientId
      LEFT JOIN (
        SELECT patientId, MAX(updatedOn) AS updatedOn
        FROM patientvitalslogs
        WHERE updatedOn BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY patientId
      ) pv ON pv.patientId = u.id
      WHERE pa.caretakerId = ?
    `, [fromDate, toDate, userId]);

    // =========================
    // 5️⃣ CRITICAL ALERTS
    // =========================
    const criticalAlerts = patientVitals.filter(
      v => v.severityLevel?.toLowerCase() === "high"
    ).length;

    // =========================
    // 6️⃣ TASK PROGRESS (filtered by date)
    // =========================
    const [taskStats] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM tasks
      WHERE assigned_by = ?
      AND created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY status
    `, [userId, fromDate, toDate]);

    let pending = 0, inProgress = 0, completed = 0;
    taskStats.forEach(t => {
      const status = t.status?.toLowerCase();
      if (status === "pending") pending = t.count;
      else if (status === "in_progress") inProgress = t.count;
      else if (status === "completed") completed = t.count;
    });

    const taskProgress = [
      { name: "Not Started", value: pending },
      { name: "In Progress", value: inProgress },
      { name: "Completed", value: completed }
    ];

    // =========================
    // 7️⃣ OVERDUE TASKS (filtered by date)
    // =========================
    const [overdueTasksResult] = await pool.query(`
      SELECT COUNT(*) as count
      FROM tasks
      WHERE assigned_by = ?
      AND status != 'completed'
      AND due_date BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
    `, [userId, fromDate, toDate]);

    const overdueTasks = overdueTasksResult[0]?.count || 0;

    // =========================
    // 8️⃣ GENDER DISTRIBUTION
    // =========================
    const [genderData] = await pool.query(`
      SELECT u.gender, COUNT(*) as count
      FROM user u
      JOIN userrole ur ON ur.userId = u.id
      JOIN roles r ON r.id = ur.roleId
      WHERE LOWER(r.roleName) = 'patient'
      AND u.id IN (
        SELECT DISTINCT patientId FROM patient_assignments WHERE caretakerId = ?
      )
      AND u.id IN (
        SELECT DISTINCT patientId FROM patientvitalslogs
        WHERE updatedOn BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      )
      GROUP BY u.gender
    `, [userId, fromDate, toDate]);

    const genderDistribution = [
      { gender: "Male", count: 0 },
      { gender: "Female", count: 0 }
    ];
    genderData.forEach(g => {
      if (g.gender?.toLowerCase() === "male") genderDistribution[0].count = g.count;
      if (g.gender?.toLowerCase() === "female") genderDistribution[1].count = g.count;
    });

    // =========================
    // 9️⃣ AGE DISTRIBUTION
    // =========================
    const [ageDistribution] = await pool.query(`
      SELECT 
        CASE
          WHEN u.age BETWEEN 0 AND 20 THEN '0-20'
          WHEN u.age BETWEEN 21 AND 40 THEN '21-40'
          WHEN u.age BETWEEN 41 AND 60 THEN '41-60'
          WHEN u.age BETWEEN 61 AND 80 THEN '61-80'
          ELSE '80+'
        END AS ageGroup,
        COUNT(*) AS count
      FROM user u
      JOIN userrole ur ON ur.userId = u.id
      JOIN roles r ON r.id = ur.roleId
      WHERE LOWER(r.roleName) = 'patient'
      AND u.id IN (
        SELECT DISTINCT patientId FROM patient_assignments WHERE caretakerId = ?
      )
      AND u.id IN (
        SELECT DISTINCT patientId FROM patientvitalslogs
        WHERE updatedOn BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      )
      GROUP BY ageGroup
      ORDER BY FIELD(ageGroup, '0-20','21-40','41-60','61-80','80+')
    `, [userId, fromDate, toDate]);

    // =========================
    // 🔟 BLOOD GROUP DISTRIBUTION
    // =========================
    const [rawBloodGroupData] = await pool.query(`
      SELECT 
        t.bloodGroup,
        u.gender,
        COUNT(*) as count
      FROM (
        SELECT patientId, bloodGroup,
               ROW_NUMBER() OVER (PARTITION BY patientId ORDER BY updatedOn DESC) rn
        FROM patientvitalslogs
        WHERE updatedOn BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      ) t
      JOIN user u ON u.id = t.patientId
      WHERE t.rn = 1
      AND t.patientId IN (
        SELECT patientId FROM patient_assignments WHERE caretakerId = ?
      )
      GROUP BY t.bloodGroup, u.gender
    `, [fromDate, toDate, userId]);

    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Not Specified"];
    const bloodGroupDistribution = bloodGroups.map(bg => ({
      bloodGroup: bg, male: 0, female: 0, other: 0, total: 0
    }));

    rawBloodGroupData.forEach(row => {
      const group = bloodGroupDistribution.find(g => g.bloodGroup === row.bloodGroup)
        || bloodGroupDistribution.find(g => g.bloodGroup === "Not Specified");
      if (!group) return;
      const gender = row.gender?.toLowerCase();
      if (gender === "male") group.male += row.count;
      else if (gender === "female") group.female += row.count;
      else group.other += row.count;
      group.total += row.count;
    });

    // =========================
    // 1️⃣1️⃣ ALERTS
    // =========================
    const [alerts] = await pool.query(`
      SELECT 
        ri.id,
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
      WHERE ri.coachId = ?
      AND ri.raisedOn BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY ri.raisedOn DESC
      LIMIT 10
    `, [userId, fromDate, toDate]);

    const formattedAlerts = alerts.map(a => ({
      id: a.id,
      severity: a.severity,
      status: a.status,
      description: a.description,
      raisedOn: a.raisedOn,
      coachName: a.coachName,
      doctorName: a.doctorName,
      patientName: a.patientName
    }));

    const recentAlerts = formattedAlerts.slice(0, 3);
    const pendingAlerts = formattedAlerts.filter(a => a.status !== "completed").length;

    // =========================
    // 1️⃣2️⃣ NEEDS ATTENTION
    // =========================
    const now = new Date();
    const notUpdatedPatients = allPatients.filter(v => {
      if (!v.updatedOn) return true;
      const diffHours = (now - new Date(v.updatedOn)) / (1000 * 60 * 60);
      return diffHours > 24;
    });

    // =========================
    // 🏁 FINAL RESPONSE
    // =========================
    return {
      stats: {
        totalPatients: totalPatients || 0,
        totalDoctors: totalDoctors || 0,
        criticalAlerts,
        pendingAlerts,
        overdueTasks
      },
      charts: {
        genderDistribution,
        ageDistribution,
        bloodGroupDistribution,
        taskProgress
      },
      alerts: {
        recentAlerts,
        notUpdatedPatients
      },
      patientVitals: patientVitals.map(v => ({
        id: v.patientId,
        name: v.name,
        bloodPressure: v.bloodPressure ?? "N/A",
        oxygen: v.oxygenSaturation ?? "N/A",
        heartRate: v.heartRate ?? "N/A",
        temperature: v.temperature ?? "N/A",
        severity: v.severityLevel ?? "Unknown",
        status: "Monitoring",
        updatedOn: v.updatedOn
      }))
    };
  }
}

module.exports = CaretakerDashboardModel;