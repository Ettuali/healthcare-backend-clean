const db = require("../config/db");

// CREATE
const createVitals = async ({ patientId, temperature, bloodPressure, heartRate, oxygenSaturation, severityLevel, postedBy }) => {
  const [result] = await db.query(
    `INSERT INTO patientvitalslogs 
      (patientId, temperature, bloodPressure, heartRate, oxygenSaturation, severityLevel, postedBy) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [patientId, temperature, bloodPressure, heartRate, oxygenSaturation, severityLevel, postedBy || null]
  );
  return result.insertId;
};

// READ all for a patient
const fetchPatientVitalsByPatientId = async (
  patientId,
  page = 1,
  limit = 5,
  period = "all",
  fromDate = null,
  toDate = null
) => {
  const offset = (page - 1) * limit;

  // -------------------------
  // Build WHERE clause
  // -------------------------
  let whereClause = "WHERE patientId = ?";
  const params = [patientId];

  if (fromDate && toDate) {
    whereClause += " AND DATE(createdOn) BETWEEN ? AND ?";
    params.push(fromDate, toDate);
  } else {
    switch (period) {
      case "last_week":
        whereClause +=
          " AND createdOn >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        break;

      case "last_month":
        whereClause +=
          " AND createdOn >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)";
        break;

      case "3_months":
        whereClause +=
          " AND createdOn >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)";
        break;

      case "6_months":
        whereClause +=
          " AND createdOn >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)";
        break;

      case "1_year":
        whereClause +=
          " AND createdOn >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
        break;

      default:
        break;
    }
  }

  // -------------------------
  // History
  // -------------------------

  const [rows] = await db.query(
    `
      SELECT
        id,
        patientId,
        temperature,
        bloodPressure,
        heartRate,
        oxygenSaturation,
        severityLevel,
        postedBy,
        updatedBy,
        createdOn,
        updatedOn
      FROM patientvitalslogs
      ${whereClause}
      ORDER BY createdOn DESC
      LIMIT ? OFFSET ?
    `,
    [...params, Number(limit), Number(offset)]
  );

  // -------------------------
  // Pagination
  // -------------------------

  const [[{ total }]] = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM patientvitalslogs
      ${whereClause}
    `,
    params
  );

  // -------------------------
  // Summary
  // -------------------------

  const [summaryRows] = await db.query(
    `
      SELECT

      COUNT(*) AS totalRecords,

      ROUND(AVG(temperature),1) AS averageTemperature,
      MIN(temperature) AS minTemperature,
      MAX(temperature) AS maxTemperature,

      ROUND(AVG(heartRate)) AS averageHeartRate,
      MIN(heartRate) AS minHeartRate,
      MAX(heartRate) AS maxHeartRate,

      ROUND(AVG(oxygenSaturation)) AS averageOxygenSaturation,
      MIN(oxygenSaturation) AS minOxygenSaturation,
      MAX(oxygenSaturation) AS maxOxygenSaturation,

      ROUND(
        AVG(
          CAST(SUBSTRING_INDEX(bloodPressure,'/',1) AS UNSIGNED)
        )
      ) AS averageSystolic,

      ROUND(
        AVG(
          CAST(SUBSTRING_INDEX(bloodPressure,'/',-1) AS UNSIGNED)
        )
      ) AS averageDiastolic,

      CONCAT(
        ROUND(
          AVG(
            CAST(SUBSTRING_INDEX(bloodPressure,'/',1) AS UNSIGNED)
          )
        ),
        '/',
        ROUND(
          AVG(
            CAST(SUBSTRING_INDEX(bloodPressure,'/',-1) AS UNSIGNED)
          )
        )
      ) AS averageBloodPressure,

      SUM(severityLevel='Normal') AS normal,
      SUM(severityLevel='Moderate') AS moderate,
      SUM(severityLevel='Critical') AS critical,
      SUM(severityLevel='Emergency') AS emergency

      FROM patientvitalslogs

      ${whereClause}
    `,
    params
  );

  return {
    summary: summaryRows[0],

    data: rows,

    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// UPDATE
const updateVitals = async (id, { temperature, bloodPressure, heartRate, oxygenSaturation, severityLevel, updatedBy }) => {
  await db.query(
    `UPDATE patientvitalslogs 
     SET temperature=?, bloodPressure=?, heartRate=?, oxygenSaturation=?, severityLevel=?, updatedBy=?, updatedOn = CURRENT_TIMESTAMP 
     WHERE id=?`,
    [temperature, bloodPressure, heartRate, oxygenSaturation, severityLevel, updatedBy || null, id]
  );
};

// UPDATE timing only
const updateTiming = async (id) => {
  await db.query(
    `UPDATE patientvitalslogs 
     SET updatedOn = CURRENT_TIMESTAMP 
     WHERE id=?`,
    [id]
  );
};

// DELETE timing (set to NULL)
const deleteTiming = async (id) => {
  await db.query(
    `UPDATE patientvitalslogs 
     SET updatedOn = NULL 
     WHERE id=?`,
    [id]
  );
};

// DELETE record
const deleteVitals = async (id) => {
  await db.query(`DELETE FROM patientvitalslogs WHERE id=?`, [id]);
};

module.exports = {
  createVitals,
  fetchPatientVitalsByPatientId,
  updateVitals,
  updateTiming,
  deleteTiming,
  deleteVitals
};