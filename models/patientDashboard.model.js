const pool = require("../config/db");
const { decrypt } = require("../services/crypto.service");

class PatientDashboardModel {
  static async getDashboardData(encryptedPatientId) {
    let patientId;

    try {
      patientId = await decrypt(encryptedPatientId, "authentication");
    } catch {
      patientId = encryptedPatientId;
    }

    const today = new Date().toISOString().split("T")[0];

    const [
      patientDetails,
      latestVitals,
      latestBloodGroup,
      latestCondition,
      alerts,
      tasks,
      medicines,
      dailyVitalsHistory,
      monthlyVitalsHistory,
    ] = await Promise.all([

      //  Patient
      pool.query(
        `SELECT 
          u.id, u.name, u.email, u.phone, u.city, u.state, u.age, u.gender,
          h.name AS hospitalName
        FROM user AS u
        LEFT JOIN assignedhospital ah ON u.id = ah.userId
        LEFT JOIN hospital h ON ah.hospitalId = h.id
        WHERE u.id=? AND u.status='active'`,
        [patientId]
      ).then(res => res[0][0]),

      //  Latest vitals
      pool.query(
        `SELECT heartRate, bloodPressure, oxygenSaturation, temperature, updatedOn
         FROM patientvitalslogs
         WHERE patientId = ?
         ORDER BY updatedOn DESC
         LIMIT 1`,
        [patientId]
      ).then(res => res[0][0]),

      pool.query(
        `SELECT bloodGroup FROM patientvitalslogs
         WHERE patientId = ? AND bloodGroup IS NOT NULL AND bloodGroup != ''
         ORDER BY updatedOn DESC LIMIT 1`,
        [patientId]
      ).then(res => res[0][0]),

      pool.query(
        `SELECT diagnosisType FROM patientvitalslogs
         WHERE patientId = ? AND diagnosisType IS NOT NULL AND diagnosisType != ''
         ORDER BY updatedOn DESC LIMIT 1`,
        [patientId]
      ).then(res => res[0][0]),

      //  Alerts
      pool.query(
        `SELECT ri.id, ri.status, ri.description, ri.raisedOn, ri.severity,
                u_coach.name AS coachName, u_doctor.name AS doctorName
         FROM raisedissues AS ri
         LEFT JOIN user AS u_coach ON ri.coachId = u_coach.id
         LEFT JOIN user AS u_doctor ON ri.doctorId = u_doctor.id
         WHERE ri.userId = ? AND ri.status != 'completed'
         ORDER BY ri.raisedOn DESC
         LIMIT 3`,
        [patientId]
      ).then(res => res[0]),

      //  Tasks
      pool.query(
        `SELECT id, title, description, due_date, status
         FROM tasks
         WHERE assigned_to = ? AND status != 'completed'
         ORDER BY due_date ASC`,
        [patientId]
      ).then(res => res[0]),

      //  FIXED MEDICINES QUERY (THIS WAS YOUR BUG)
      pool.query(
  `SELECT 
      am.id,
      am.medicineName,
      am.dosage,
      ms.time AS timing,
      ms.label,
      ms.food,
      COALESCE(mil.status, 'pending') AS status,
      mil.intakeTime

   FROM assignedmedicines am

   JOIN medicine_schedules ms 
     ON am.id = ms.assignmentId

   LEFT JOIN medicationintakelogs mil 
     ON am.id = mil.medicineAssignmentId
     AND DATE(mil.intakeDate) = ?

   WHERE am.patientId = ?

     -- ONLY LATEST MEDICINE ASSIGNMENT
     AND am.id = (
       SELECT MAX(id)
       FROM assignedmedicines
       WHERE patientId = ?
     )

     AND am.startDate <= ?
     AND (am.endDate IS NULL OR am.endDate >= ?)

   ORDER BY ms.time ASC`,
  [today, patientId, patientId, today, today]
).then(res => res[0]),

      //  Vitals history
      pool.query(
        `SELECT heartRate, bloodPressure, oxygenSaturation, temperature, updatedOn
         FROM patientvitalslogs
         WHERE patientId = ? 
           AND updatedOn >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         ORDER BY updatedOn ASC`,
        [patientId]
      ).then(res => res[0]),

      pool.query(
        `SELECT heartRate, bloodPressure, oxygenSaturation, temperature, updatedOn
         FROM patientvitalslogs
         WHERE patientId = ? 
           AND updatedOn >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         ORDER BY updatedOn ASC`,
        [patientId]
      ).then(res => res[0]),
    ]);

    if (!patientDetails) {
      throw new Error("Invalid Patient ID or patient is inactive.");
    }

    //  Format medicines (FIXED)
    const formattedMedicines = medicines.map((med) => ({
      id: med.id,
      medicineName: med.medicineName,
      dosage: med.dosage,
      timing: med.timing,
      label: med.label,
      food: med.food,
      status: med.status,
      intakeTime: med.intakeTime,
    }));

    return {
      patientData: {
        name: patientDetails.name,
        age: patientDetails.age,
        gender: patientDetails.gender,
        location: `${patientDetails.city || "N/A"}, ${patientDetails.state || "N/A"}`,
        bloodGroup: latestBloodGroup?.bloodGroup || "N/A",
        condition: latestCondition?.diagnosisType || "N/A",
        email: patientDetails.email,
        hospital: patientDetails.hospitalName || "N/A",
      },
      vitalsConfig: latestVitals,
      alertsData: alerts,
      todaysTasks: tasks,
      medicines: formattedMedicines,
      dailyVitalsHistory,
      monthlyVitalsHistory,
    };
  }
}

module.exports = PatientDashboardModel;