const db = require('../config/db'); 

const PatientChartsModel = {
    fetchVitalsHistory: async ({ patientId, vitalType, view }) => {
        let dateFilter;
        let selectLabel;
        
        // 1. Define Date Range and Label Format
        if (view === 'last_week') {
            dateFilter = 'DATE(createdOn) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            selectLabel = 'DATE_FORMAT(createdOn, "%a")'; // e.g., Mon
        } else if (view === 'last_month') {
            dateFilter = 'DATE(createdOn) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
            selectLabel = 'DATE_FORMAT(createdOn, "%m-%d")'; // e.g., 10-09
        } else {
            throw new Error("Invalid view parameter.");
        }

        // 2. Handle Blood Pressure (Non-Numeric) - Gets the last reading of the day
        if (vitalType === 'bloodPressure') {
             const subQuery = `
                 SELECT MAX(createdOn) as max_createdOn
                 FROM patientvitalslogs
                 WHERE patientId = ? AND ${dateFilter} AND bloodPressure IS NOT NULL
                 GROUP BY DATE(createdOn)
             `;
             const finalQuery = `
                 SELECT 
                     ${selectLabel} AS label,
                     T1.bloodPressure AS value,
                     DATE(T1.createdOn) AS sort_date
                 FROM 
                     patientvitalslogs T1
                 INNER JOIN 
                     (${subQuery}) T2 ON T1.createdOn = T2.max_createdOn
                 WHERE
                     T1.patientId = ?
                 ORDER BY sort_date ASC
             `;
             const [rows] = await db.query(finalQuery, [patientId, patientId]);
             return rows;
        }

        // 3. Handle Other Vitals (Numeric) - Calculates the daily average
        const finalQuery = `
             SELECT
                 ${selectLabel} AS label,
                 AVG(${vitalType}) AS value,
                 DATE(createdOn) AS sort_date
             FROM
                 patientvitalslogs
             WHERE
                 patientId = ? AND ${dateFilter} AND ${vitalType} IS NOT NULL
             GROUP BY sort_date, label  -- ✨ THE FIX: Added 'label' to the GROUP BY clause
             ORDER BY sort_date ASC
        `;
        
        const [rows] = await db.query(finalQuery, [patientId]);
        return rows;
    },
};

module.exports = PatientChartsModel;