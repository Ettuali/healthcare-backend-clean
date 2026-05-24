const db = require("../config/db");

const AdminDashboardModel = {

  async getStateWiseStats() {
    const query = `
SELECT 
    -- Use the User's state, if null use the Hospital-User's state, otherwise 'Unknown'
    COALESCE(TRIM(u.state), TRIM(h_user.state), 'Other') AS state,
    COUNT(DISTINCT ah.hospitalId) AS hospitals,
    COUNT(DISTINCT CASE WHEN r.roleName = 'doctor' THEN u.id END) AS doctors,
    COUNT(DISTINCT CASE WHEN r.roleName = 'patient' THEN u.id END) AS patients
FROM assignedhospital ah
-- Join the user (Doctor/Patient)
JOIN user u ON ah.userId = u.id
JOIN userrole ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id
-- Join the hospital record
JOIN hospital h ON ah.hospitalId = h.id
-- Join the hospital's own user account to get its state (e.g., Apollo's state)
LEFT JOIN user h_user ON h.name = h_user.name 
WHERE r.roleName IN ('doctor', 'patient')
GROUP BY state
ORDER BY hospitals DESC;
    `;

    const rows = await db.executeQuery(query);

    const formatState = (s) =>
      s.charAt(0).toUpperCase() + s.slice(1);

    return rows.map(r => ({
      state: formatState(r.state),
      hospitals: Number(r.hospitals) || 0,
      patients: Number(r.patients) || 0,
      doctors: Number(r.doctors) || 0,
    }));
  }

};

module.exports = AdminDashboardModel;