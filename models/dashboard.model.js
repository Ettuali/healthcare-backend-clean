// Dashboard.js
const db = require("../config/db");

class Dashboard {
  /**
   * Fetches total counts of users by role and hospitals, filtered by creation month/year.
   * @param {number} [year] - The year to filter by. If null, no year filter applied.
   * @param {number} [month] - The month to filter by (1-12). If null, no month filter applied.
   * @returns {Promise<Object>} An object with total counts.
   */
  static async getTotalCounts(year, month) {
    try {
      const [userRows] = await db.query(
        `
                SELECT r.roleName, COUNT(ur.userId) AS count
                FROM userrole ur
                JOIN roles r ON ur.roleId = r.id
                JOIN user u ON ur.userId = u.id 
                WHERE r.roleName IN ('doctor','nurse','patient','caretaker','admin')
                AND (? IS NULL OR YEAR(u.createdOn) = ?)
                AND (? IS NULL OR MONTH(u.createdOn) = ?)
                GROUP BY r.roleName
            `,
        [year, year, month, month],
      );

      const [hospitalRows] = await db.query(
        `
                SELECT COUNT(*) AS totalHospitals 
                FROM hospital
                WHERE (? IS NULL OR YEAR(createdAt) = ?)
                AND (? IS NULL OR MONTH(createdAt) = ?)
            `,
        [year, year, month, month],
      );

      const totalCounts = {
        totalAdmins: 0,
        totalDoctors: 0,
        totalNurses: 0,
        totalPatients: 0,
        totalCaretakers: 0,
        totalHospitals: 0,
      };

      userRows.forEach((row) => {
        const roleName =
          row.roleName.charAt(0).toUpperCase() + row.roleName.slice(1);
        totalCounts["total" + roleName + "s"] = row.count;
      });

      totalCounts.totalHospitals = hospitalRows[0]?.totalHospitals || 0;

      return totalCounts;
    } catch (error) {
      console.error("Error fetching total counts:", error);
      throw error;
    }
  }

  /**
   * Fetches a weekly breakdown of new users. Filters for the last 4 weeks
   * by default, or for the *entire year* if a year parameter is provided.
   * @param {number} [year] - The year to filter by. If null, defaults to last 4 weeks.
   * @returns {Promise<Array>} An array of objects with weekly counts.
   */
  static async getWeeklyUsers(year) {
    let dateFilter = "u.createdOn >= DATE_SUB(NOW(), INTERVAL 4 WEEK)";
    let hospitalDateFilter = "createdAt >= DATE_SUB(NOW(), INTERVAL 4 WEEK)";
    const params = [];

    if (year) {
      dateFilter = "YEAR(u.createdOn) = ?";
      hospitalDateFilter = "YEAR(createdAt) = ?";
      params.push(year);
    }

    try {
      const [rows] = await db.query(
        `
                SELECT 
                    YEAR(u.createdOn) AS regYear,
                    WEEK(u.createdOn, 3) AS week_number,
                    DATE_FORMAT(u.createdOn, '%M') AS month,
                    MONTH(u.createdOn) AS month_num,
                    COUNT(u.id) AS totalUsers,
                    SUM(CASE WHEN r.roleName = 'patient' THEN 1 ELSE 0 END) AS totalPatients,
                    SUM(CASE WHEN r.roleName = 'doctor' THEN 1 ELSE 0 END) AS totalDoctors,
                    SUM(CASE WHEN r.roleName = 'nurse' THEN 1 ELSE 0 END) AS totalNurses,
                    SUM(CASE WHEN r.roleName = 'caretaker' THEN 1 ELSE 0 END) AS totalCaretakers
                FROM user u
                LEFT JOIN userrole ur ON u.id = ur.userId
                LEFT JOIN roles r ON ur.roleId = r.id
                WHERE ${dateFilter}
                GROUP BY regYear, week_number, month, month_num
                ORDER BY regYear ASC, month_num ASC, week_number ASC
            `,
        params,
      );

      const hospitalParams = [...params];
      const [hospitalRows] = await db.query(
        `
                SELECT 
                    YEAR(createdAt) AS regYear,
                    WEEK(createdAt, 3) AS week_number,
                    MONTH(createdAt) AS month_num,
                    COUNT(id) AS totalHospitals
                FROM hospital
                WHERE ${hospitalDateFilter}
                GROUP BY regYear, week_number, month_num
                ORDER BY regYear ASC, month_num ASC, week_number ASC
            `,
        hospitalParams,
      );

      const weeklyData = {};
      let weekCounter = 1;
      const weekNumberMap = {};
      const yearMonthWeekCounter = new Map();
      let previousYearMonthKey = null;

      rows.forEach((row) => {
        const yearMonthKey = `${row.regYear}-${row.month_num}`;

        let weekKey;

        if (year) {
          if (yearMonthKey !== previousYearMonthKey) {
            yearMonthWeekCounter.set(yearMonthKey, 1);
            previousYearMonthKey = yearMonthKey;
          } else {
            yearMonthWeekCounter.set(
              yearMonthKey,
              yearMonthWeekCounter.get(yearMonthKey) + 1,
            );
          }

          const relativeWeekNumber = yearMonthWeekCounter.get(yearMonthKey);
          weekKey = `Week ${relativeWeekNumber}`;
        } else {
          const key = `${row.regYear}-${row.week_number}`;
          if (!weekNumberMap[key]) {
            weekNumberMap[key] = "Week " + weekCounter++;
          }
          weekKey = weekNumberMap[key];
        }

        const dataKey = `${row.regYear}-${row.week_number}`;

        weeklyData[dataKey] = {
          period: weekKey,
          year: row.regYear,
          month: row.month,
          totalUsers: row.totalUsers,
          totalPatients: row.totalPatients,
          totalDoctors: row.totalDoctors,
          totalNurses: row.totalNurses,
          totalCaretakers: row.totalCaretakers,
          totalHospitals: 0,
        };
      });

      hospitalRows.forEach((row) => {
        const dataKey = `${row.regYear}-${row.week_number}`;
        if (weeklyData[dataKey]) {
          weeklyData[dataKey].totalHospitals = row.totalHospitals;
        }
      });

      if (year) {
        const sortedData = Object.values(weeklyData).sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;

          const monthOrder = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          const monthA = monthOrder.indexOf(a.month);
          const monthB = monthOrder.indexOf(b.month);
          if (monthA !== monthB) return monthA - monthB;

          const weekNumA = parseInt(a.period.replace("Week ", ""));
          const weekNumB = parseInt(b.period.replace("Week ", ""));
          return weekNumA - weekNumB;
        });
        return sortedData;
      }

      return Object.values(weeklyData);
    } catch (error) {
      console.error("Error fetching weekly counts:", error);
      throw error;
    }
  }

  /**
   * Fetches daily counts for users, roles, and hospitals for a specific month and year.
   * @param {number} year - The year to filter by.
   * @param {number} month - The month to filter by (1-12).
   * @returns {Promise<Array>} An array of objects with daily counts.
   */
  static async getMonthlyDetails(year, month) {
    try {
      const [userCounts] = await db.query(
        `
                SELECT
                    DATE(u.createdOn) AS period,
                    COUNT(u.id) AS totalUsers,
                    SUM(CASE WHEN r.roleName = 'patient' THEN 1 ELSE 0 END) AS totalPatients,
                    SUM(CASE WHEN r.roleName = 'doctor' THEN 1 ELSE 0 END) AS totalDoctors,
                    SUM(CASE WHEN r.roleName = 'nurse' THEN 1 ELSE 0 END) AS totalNurses,
                    SUM(CASE WHEN r.roleName = 'caretaker' THEN 1 ELSE 0 END) AS totalCaretakers
                FROM user u
                LEFT JOIN userrole ur ON u.id = ur.userId
                LEFT JOIN roles r ON ur.roleId = r.id
                WHERE YEAR(u.createdOn) = ? AND MONTH(u.createdOn) = ?
                GROUP BY DATE(u.createdOn)
                ORDER BY DATE(u.createdOn) ASC
            `,
        [year, month],
      );

      const [hospitalCounts] = await db.query(
        `
                SELECT
                    DATE(createdAt) AS period,
                    COUNT(id) AS totalHospitals
                FROM hospital
                WHERE YEAR(createdAt) = ? AND MONTH(createdAt) = ?
                GROUP BY DATE(createdAt)
                ORDER BY DATE(createdAt) ASC
            `,
        [year, month],
      );

      const dailyData = {};

      userCounts.forEach((row) => {
        const dateKey = new Date(row.period).toISOString().split("T")[0];
        dailyData[dateKey] = {
          period: dateKey,
          totalUsers: row.totalUsers,
          totalPatients: row.totalPatients,
          totalDoctors: row.totalDoctors,
          totalNurses: row.totalNurses,
          totalCaretakers: row.totalCaretakers,
          totalHospitals: 0,
        };
      });

      hospitalCounts.forEach((row) => {
        const dateKey = new Date(row.period).toISOString().split("T")[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].totalHospitals = row.totalHospitals;
        } else {
          dailyData[dateKey] = {
            period: dateKey,
            totalUsers: 0,
            totalPatients: 0,
            totalDoctors: 0,
            totalNurses: 0,
            totalCaretakers: 0,
            totalHospitals: row.totalHospitals,
          };
        }
      });

      // total days in that month
      const daysInMonth = new Date(year, month, 0).getDate();
      const fullData = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day).toISOString().split("T")[0];

        if (dailyData[date]) {
          fullData.push(dailyData[date]);
        } else {
          fullData.push({
            period: date,
            totalUsers: 0,
            totalPatients: 0,
            totalDoctors: 0,
            totalNurses: 0,
            totalCaretakers: 0,
            totalHospitals: 0,
          });
        }
      }

      return fullData;
    } catch (error) {
      console.error("Error fetching monthly details:", error);
      throw error;
    }
  }

  /**
   * Fetches a yearly breakdown of new users, roles, and hospitals, showing counts per month.
   * @param {number} [year] - The year to filter by. If null, no year filter applied.
   * @returns {Promise<Array>} An array of objects with monthly counts for the selected year.
   */
  static async getYearlyPerformance(year) {
    try {
      const [rows] = await db.query(
        `
                SELECT
                    DATE_FORMAT(u.createdOn, '%Y-%m') AS period,
                    DATE_FORMAT(u.createdOn, '%M') AS month,
                    COUNT(u.id) AS totalUsers,
                    SUM(CASE WHEN r.roleName = 'patient' THEN 1 ELSE 0 END) AS totalPatients,
                    SUM(CASE WHEN r.roleName = 'doctor' THEN 1 ELSE 0 END) AS totalDoctors,
                    SUM(CASE WHEN r.roleName = 'nurse' THEN 1 ELSE 0 END) AS totalNurses,
                    SUM(CASE WHEN r.roleName = 'caretaker' THEN 1 ELSE 0 END) AS totalCaretakers
                FROM user u
                LEFT JOIN userrole ur ON u.id = ur.userId
                LEFT JOIN roles r ON ur.roleId = r.id
                WHERE (? IS NULL OR YEAR(u.createdOn) = ?)
                GROUP BY period, month
                ORDER BY period ASC
            `,
        [year, year],
      );

      const [hospitalRows] = await db.query(
        `
                SELECT
                    DATE_FORMAT(createdAt, '%Y-%m') AS period,
                    COUNT(id) AS totalHospitals
                FROM hospital
                WHERE (? IS NULL OR YEAR(createdAt) = ?)
                GROUP BY period
                ORDER BY period ASC
            `,
        [year, year],
      );

      const monthlyData = {};
      rows.forEach((row) => {
        monthlyData[row.period] = {
          period: row.period,
          month: row.month,
          totalUsers: row.totalUsers,
          totalPatients: row.totalPatients,
          totalDoctors: row.totalDoctors,
          totalNurses: row.totalNurses,
          totalCaretakers: row.totalCaretakers,
          totalHospitals: 0,
        };
      });

      hospitalRows.forEach((row) => {
        if (monthlyData[row.period]) {
          monthlyData[row.period].totalHospitals = row.totalHospitals;
        }
      });

      const result = Object.values(monthlyData);

const fullData = [];

for (let month = 1; month <= 12; month++) {
  const key = `${year}-${String(month).padStart(2, "0")}`;

  if (monthlyData[key]) {
    fullData.push(monthlyData[key]);
  } else {
    fullData.push({
      period: key,
      month: new Date(year, month - 1).toLocaleString("en-IN", {
        month: "long",
      }),
      totalUsers: 0,
      totalPatients: 0,
      totalDoctors: 0,
      totalNurses: 0,
      totalCaretakers: 0,
      totalHospitals: 0,
    });
  }
}

return fullData;
    } catch (error) {
      console.error("Error fetching yearly performance:", error);
      throw error;
    }
  }

  /**
   * Fetches a breakdown of hospitals, the count of assigned doctors,
   * their names and specialization, and the total count of patients assigned to that hospital,
   * filtered by the user's assignment date to the hospital.
   * @param {number|null} year - The year to filter by. If null, no year filter applied.
   * @param {number|null} month - The month to filter by (1-12). If null, no month filter applied.
   * @returns {Promise<Array>} An array of objects with hospital breakdown.
   */
  static async getHospitalDoctorPatientBreakdown(year, month) {
    try {
      const [hospitalRows] = await db.query(
        `
                SELECT
                    h.id AS hospitalId,
                    h.name AS hospitalName,
                    COALESCE(SUM(CASE 
                        WHEN r.roleName = 'doctor' AND (? IS NULL OR YEAR(ah.assignedOn) = ?) AND (? IS NULL OR MONTH(ah.assignedOn) = ?) THEN 1 
                        ELSE 0 
                    END), 0) AS totalDoctors,
                    COALESCE(GROUP_CONCAT(DISTINCT 
                        CASE WHEN r.roleName = 'doctor' AND (? IS NULL OR YEAR(ah.assignedOn) = ?) AND (? IS NULL OR MONTH(ah.assignedOn) = ?) 
                             THEN CONCAT(u.name, ' (', u.specialization, ')') 
                             ELSE NULL 
                        END 
                        SEPARATOR '; '
                    ), '') AS doctorDetails,
                    COALESCE(SUM(CASE 
                        WHEN r.roleName = 'patient' AND (? IS NULL OR YEAR(ah.assignedOn) = ?) AND (? IS NULL OR MONTH(ah.assignedOn) = ?) THEN 1 
                        ELSE 0 
                    END), 0) AS totalPatients
                FROM hospital h
                LEFT JOIN assignedhospital ah ON h.id = ah.hospitalId
                LEFT JOIN user u ON ah.userId = u.id
                LEFT JOIN userrole ur ON ah.userId = ur.userId
                LEFT JOIN roles r ON ur.roleId = r.id 
                GROUP BY h.id, h.name
                ORDER BY h.name ASC
            `,
        [
          year,
          year,
          month,
          month,
          year,
          year,
          month,
          month,
          year,
          year,
          month,
          month,
        ],
      );

      return hospitalRows;
    } catch (error) {
      console.error(
        "Error fetching hospital, doctor, patient breakdown:",
        error,
      );
      throw error;
    }
  }

  /**
   * Fetches all hospitals and the count of assigned patients, filtered by assignment date.
   * @param {number|null} year - The year to filter by. If null, no year filter applied.
   * @param {number|null} month - The month to filter by (1-12). If null, no month filter applied.
   * @returns {Promise<Array>} An array of objects with hospital ID, name, and total assigned patients.
   */
  static async getHospitalPatientCounts(year, month) {
    try {
      const [hospitalRows] = await db.query(
        `
                SELECT
                    h.id AS hospitalId,
                    h.name AS hospitalName,
                    COALESCE(SUM(CASE 
                        WHEN r.roleName = 'patient' AND (? IS NULL OR YEAR(ah.assignedOn) = ?) AND (? IS NULL OR MONTH(ah.assignedOn) = ?) THEN 1 
                        ELSE 0 
                    END), 0) AS totalAssignedPatients
                FROM hospital h
                LEFT JOIN assignedhospital ah ON h.id = ah.hospitalId
                LEFT JOIN userrole ur ON ah.userId = ur.userId
                LEFT JOIN roles r ON ur.roleId = r.id 
                GROUP BY h.id, h.name
                ORDER BY h.name ASC
            `,
        [year, year, month, month],
      );

      return hospitalRows;
    } catch (error) {
      console.error("Error fetching hospital patient counts:", error);
      throw error;
    }
  }

  /**
   * Fetches a breakdown of assigned patients by hospital and blood group, filtered by the patient's vitals log creation date.
   * @param {number|null} year - The year to filter by. If null, no year filter applied.
   * @param {number|null} month - The month to filter by (1-12). If null, no month filter applied.
   * @returns {Promise<Array>} An array of objects with hospital ID, name, blood group, and patient count.
   */
  static async getHospitalPatientBloodGroupBreakdown(year, month) {
    try {
      const [rows] = await db.query(
        `
                SELECT
                    h.id AS hospitalId,
                    h.name AS hospitalName,
                    pvl.bloodGroup,
                    COUNT(DISTINCT u.id) AS totalPatients
                FROM hospital h
                INNER JOIN assignedhospital ah ON h.id = ah.hospitalId
                INNER JOIN user u ON ah.userId = u.id
                INNER JOIN userrole ur ON u.id = ur.userId
                INNER JOIN roles r ON ur.roleId = r.id AND r.roleName = 'patient'
                INNER JOIN patientvitalslogs pvl ON u.id = pvl.patientId
                WHERE pvl.bloodGroup IS NOT NULL
                AND (? IS NULL OR YEAR(pvl.createdOn) = ?)
                AND (? IS NULL OR MONTH(pvl.createdOn) = ?)
                GROUP BY h.id, h.name, pvl.bloodGroup
                ORDER BY h.name ASC, pvl.bloodGroup ASC
            `,
        [year, year, month, month],
      );

      return rows;
    } catch (error) {
      console.error(
        "Error fetching hospital patient blood group breakdown:",
        error,
      );
      throw error;
    }
  }

  /**
   * Fetches a breakdown of assigned patients by hospital and gender, filtered by the user's creation date.
   * @param {number|null} year - The year to filter by. If null, no year filter applied.
   * @param {number|null} month - The month to filter by (1-12). If null, no month filter applied.
   * @returns {Promise<Array>} An array of objects with hospital ID, name, gender, and patient count.
   */
  static async getHospitalPatientGenderBreakdown(year, month) {
    try {
      const [rows] = await db.query(
        `
                SELECT
                    h.id AS hospitalId,
                    h.name AS hospitalName,
                    u.gender,
                    COUNT(DISTINCT u.id) AS totalPatients
                FROM hospital h
                INNER JOIN assignedhospital ah ON h.id = ah.hospitalId
                INNER JOIN user u ON ah.userId = u.id
                INNER JOIN userrole ur ON u.id = ur.userId
                INNER JOIN roles r ON ur.roleId = r.id AND r.roleName = 'patient'
                WHERE u.gender IS NOT NULL
                AND (? IS NULL OR YEAR(u.createdOn) = ?)
                AND (? IS NULL OR MONTH(u.createdOn) = ?)
                GROUP BY h.id, h.name, u.gender
                ORDER BY h.name ASC, u.gender ASC
            `,
        [year, year, month, month],
      );

      return rows;
    } catch (error) {
      console.error("Error fetching hospital patient gender breakdown:", error);
      throw error;
    }
  }

  /**
   * Fetches the total count and percentage breakdown of patient genders.
   * @param {number|null} [year] - The year to filter by. If null, no year filter applied.
   * @param {number|null} [month] - The month to filter by (1-12). If null, no month filter applied.
   * @param {number|null} [hospitalId] - Optional hospital ID to filter by.
   * @returns {Promise<Array>} An array of objects with gender, totalCount, and percentage.
   */
  static async getTotalPatientGenderBreakdown(year, month, hospitalId) {
    try {
      const [rows] = await db.query(
        `
                SELECT
                    u.gender,
                    COUNT(DISTINCT u.id) AS totalCount,
                    CONCAT(
                        CAST(
                            (COUNT(DISTINCT u.id) * 100.0 / (
                                SELECT COUNT(DISTINCT u2.id) FROM user u2
                                INNER JOIN userrole ur2 ON u2.id = ur2.userId
                                INNER JOIN roles r2 ON ur2.roleId = r2.id AND r2.roleName = 'patient'
                                LEFT JOIN assignedhospital ah2 ON u2.id = ah2.userId
                                WHERE u2.gender IS NOT NULL
                                AND (? IS NULL OR YEAR(u2.createdOn) = ?)
                                AND (? IS NULL OR MONTH(u2.createdOn) = ?)
                                AND (? IS NULL OR ah2.hospitalId = ?)
                            )) AS DECIMAL(5, 0)
                        ), '%'
                    ) AS percentage
                FROM user u
                INNER JOIN userrole ur ON u.id = ur.userId
                INNER JOIN roles r ON ur.roleId = r.id AND r.roleName = 'patient'
                LEFT JOIN assignedhospital ah ON u.id = ah.userId
                WHERE u.gender IS NOT NULL
                AND (? IS NULL OR YEAR(u.createdOn) = ?)
                AND (? IS NULL OR MONTH(u.createdOn) = ?)
                AND (? IS NULL OR ah.hospitalId = ?)
                GROUP BY u.gender
                ORDER BY totalCount DESC
            `,
        [
          year,
          year,
          month,
          month,
          hospitalId,
          hospitalId,
          year,
          year,
          month,
          month,
          hospitalId,
          hospitalId,
        ],
      );
      return rows;
    } catch (error) {
      console.error("Error fetching total patient gender breakdown:", error);
      throw error;
    }
  }

  /**
   * Fetches the total count and percentage breakdown of patient blood groups across all hospitals,
   * with optional filtering by hospital, and mandatory filtering by vitals log creation date.
   * @param {number|null} [year] - The year to filter by. If null, no year filter applied.
   * @param {number|null} [month] - The month to filter by (1-12). If null, no month filter applied.
   * @param {number|null} [hospitalId] - Optional hospital ID to filter by.
   * @returns {Promise<Array>} An array of objects with bloodGroup, male, female, other, and total.
   */
  static async getTotalPatientBloodGroupBreakdown(year, month, hospitalId) {
    try {
      const [rows] = await db.query(
        `
                SELECT
                    pvl.bloodGroup,
                    SUM(CASE WHEN u.gender = 'male' THEN 1 ELSE 0 END) AS male,
                    SUM(CASE WHEN u.gender = 'female' THEN 1 ELSE 0 END) AS female,
                    SUM(CASE WHEN u.gender = 'other' THEN 1 ELSE 0 END) AS other,
                    COUNT(DISTINCT u.id) AS total
                FROM patientvitalslogs pvl
                INNER JOIN user u ON pvl.patientId = u.id
                INNER JOIN userrole ur ON u.id = ur.userId
                INNER JOIN roles r ON ur.roleId = r.id AND r.roleName = 'patient'
                LEFT JOIN assignedhospital ah ON pvl.patientId = ah.userId
                WHERE pvl.bloodGroup IS NOT NULL
                AND (? IS NULL OR YEAR(pvl.createdOn) = ?)
                AND (? IS NULL OR MONTH(pvl.createdOn) = ?)
                AND (? IS NULL OR ah.hospitalId = ?)
                GROUP BY pvl.bloodGroup
                ORDER BY total DESC
            `,
        [year, year, month, month, hospitalId, hospitalId],
      );

      return rows;
    } catch (error) {
      console.error(
        "Error fetching total patient blood group breakdown:",
        error,
      );
      throw error;
    }
  }

  /**
   * Fetches the count of patients assigned to hospitals, grouped by hospital name.
   * Filtered by the patient's assignment date to the hospital.
   * @param {number|null} [year] - The year to filter by. If null, no year filter applied.
   * @param {number|null} [month] - The month to filter by (1-12). If null, no month filter applied.
   * @param {number|null} [hospitalId] - Optional hospital ID to filter by.
   * @returns {Promise<Array>} An array of objects with specializationName, totalPatients, and hospitalName.
   */
  static async getPatientBreakdownBySpecialization(year, month, hospitalId) {
    try {
      const [rows] = await db.query(
        `
                SELECT
                    'General Medicine' AS specializationName,
                    patient_h.name AS hospitalName,
                    COUNT(DISTINCT patient_u.id) AS totalPatients
                FROM user patient_u
                INNER JOIN userrole patient_ur ON patient_u.id = patient_ur.userId
                INNER JOIN roles patient_r ON patient_ur.roleId = patient_r.id 
                INNER JOIN assignedhospital patient_ah ON patient_u.id = patient_ah.userId
                INNER JOIN hospital patient_h ON patient_ah.hospitalId = patient_h.id
                WHERE patient_r.roleName = 'patient'
                AND (? IS NULL OR YEAR(patient_ah.assignedOn) = ?)
                AND (? IS NULL OR MONTH(patient_ah.assignedOn) = ?)
                AND (? IS NULL OR patient_h.id = ?)
                GROUP BY patient_h.name
                ORDER BY patient_h.name ASC
            `,
        [year, year, month, month, hospitalId, hospitalId],
      );
      return rows;
    } catch (error) {
      console.error(
        "Error fetching patient breakdown by specialization:",
        error,
      );
      throw error;
    }
  }

  /**
   * Fetches the count of patients broken down by age range,
   * including hospital name, filtered by user creation date, and optionally by hospital.
   * @param {number|null} [year] - The year to filter by. If null, no year filter applied.
   * @param {number|null} [month] - The month to filter by (1-12). If null, no month filter applied.
   * @param {number|null} [hospitalId] - Optional hospital ID to filter by.
   * @returns {Promise<Array>} An array of objects with ageRange, totalPatients, and hospitalName.
   */
  static async getPatientBreakdownByAge(year, month, hospitalId) {
    try {
      const [rows] = await db.query(
        `
                SELECT
                    CASE
                        WHEN CAST(u.age AS UNSIGNED) <= 20 THEN '0-20'
                        WHEN CAST(u.age AS UNSIGNED) BETWEEN 21 AND 40 THEN '21-40'
                        WHEN CAST(u.age AS UNSIGNED) BETWEEN 41 AND 50 THEN '41-50'
                        WHEN CAST(u.age AS UNSIGNED) BETWEEN 51 AND 60 THEN '51-60'
                        WHEN CAST(u.age AS UNSIGNED) BETWEEN 61 AND 70 THEN '61-70'
                        WHEN CAST(u.age AS UNSIGNED) BETWEEN 71 AND 80 THEN '71-80'
                        WHEN CAST(u.age AS UNSIGNED) >= 81 THEN '81+'
                        ELSE 'Other'
                    END AS ageRange,
                    h.name AS hospitalName,
                    COUNT(u.id) AS totalPatients
                FROM user u
                INNER JOIN userrole ur ON u.id = ur.userId
                INNER JOIN roles r ON ur.roleId = r.id
                LEFT JOIN assignedhospital ah ON u.id = ah.userId
                LEFT JOIN hospital h ON ah.hospitalId = h.id
                WHERE r.roleName = 'patient' AND u.age IS NOT NULL AND u.age REGEXP '^[0-9]+$'
                AND (? IS NULL OR YEAR(u.createdOn) = ?)
                AND (? IS NULL OR MONTH(u.createdOn) = ?)
                AND (? IS NULL OR h.id = ?)
                GROUP BY ageRange, h.name
                ORDER BY 
                    CASE 
                        WHEN ageRange = '0-20' THEN 0 
                        WHEN ageRange = '21-40' THEN 21
                        WHEN ageRange = '41-50' THEN 41
                        WHEN ageRange = '51-60' THEN 51
                        WHEN ageRange = '61-70' THEN 61
                        WHEN ageRange = '71-80' THEN 71
                        WHEN ageRange = '81+' THEN 81
                        ELSE 999 
                    END ASC,
                    h.name ASC
            `,
        [year, year, month, month, hospitalId, hospitalId],
      );
      return rows;
    } catch (error) {
      console.error("Error fetching patient breakdown by age:", error);
      throw error;
    }
  }

  /**
   * Fetches the total count of doctors broken down by specialization,
   * optionally filtered by doctor creation date (year/month) and hospital.
   * @param {number|null} [year] - The year to filter by. If null, no year filter applied.
   * @param {number|null} [month] - The month to filter by (1-12). If null, no month filter applied.
   * @param {number|null} [hospitalId] - Optional hospital ID to filter by.
   * @returns {Promise<Array>} An array of objects with specialization, doctorCount, and monthlyCounts.
   */
  static async getDoctorsBySpecialization(year, month, hospitalId) {
    try {
      const [rows] = await db.query(
        `
                SELECT 
                    u.specialization, 
                    COUNT(u.id) AS doctorCount,
                    (
                        SELECT 
                            JSON_ARRAYAGG(
                                JSON_OBJECT('year', monthly_counts.regYear, 'month', monthly_counts.regMonth, 'count', monthly_counts.count)
                            )
                        FROM (
                            SELECT
                                YEAR(u_inner.createdOn) AS regYear,
                                MONTH(u_inner.createdOn) AS regMonth,
                                COUNT(u_inner.id) AS count
                            FROM user u_inner
                            JOIN userrole ur_inner ON u_inner.id = ur_inner.userId
                            JOIN roles r_inner ON ur_inner.roleId = r_inner.id
                            LEFT JOIN assignedhospital ah_inner ON u_inner.id = ah_inner.userId
                            WHERE 
                                r_inner.roleName = 'doctor' 
                                AND u_inner.specialization = u.specialization
                                AND (? IS NULL OR YEAR(u_inner.createdOn) = ?)
                                AND (? IS NULL OR MONTH(u_inner.createdOn) = ?)
                                AND (? IS NULL OR ah_inner.hospitalId = ?)
                            GROUP BY regYear, regMonth
                            ORDER BY regYear DESC, regMonth DESC
                        ) AS monthly_counts
                    ) AS monthlyCounts
                FROM user u
                JOIN userrole ur ON u.id = ur.userId
                JOIN roles r ON ur.roleId = r.id
                LEFT JOIN assignedhospital ah ON u.id = ah.userId
                WHERE 
                    r.roleName = 'doctor' 
                    AND u.specialization IS NOT NULL
                    AND (? IS NULL OR YEAR(u.createdOn) = ?)
                    AND (? IS NULL OR MONTH(u.createdOn) = ?)
                    AND (? IS NULL OR ah.hospitalId = ?)
                GROUP BY u.specialization
                ORDER BY doctorCount DESC
            `,
        [
          year,
          year,
          month,
          month,
          hospitalId,
          hospitalId,
          year,
          year,
          month,
          month,
          hospitalId,
          hospitalId,
        ],
      );

      return rows.map((doctor) => ({
        ...doctor,
        monthlyCounts: doctor.monthlyCounts || [],
      }));
    } catch (error) {
      console.error("Error fetching doctor specialization breakdown:", error);
      throw error;
    }
  }
}

module.exports = Dashboard;