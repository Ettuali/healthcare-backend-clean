const pool = require('../config/db');

const deactivateExpiredPatients = async () => {
  // Get a connection from the pool to use for the transaction
  const connection = await pool.getConnection();
  try {
    // Start the transaction
    await connection.beginTransaction();

    // 1️⃣ Mark all active packages that are past end_date as 'Expired'
    const [packageResult] = await connection.query(`
      UPDATE user_packages
      SET status = 'Expired'
      WHERE end_date < NOW() AND status = 'Active'
    `);
    const packagesUpdated = packageResult.affectedRows;

    // 2️⃣ Deactivate (soft delete) users whose LATEST package is now expired
    const [userResult] = await connection.query(`
      UPDATE user u
      JOIN user_packages up ON u.id = up.user_id
      SET u.status = 'Inactive'
      WHERE up.status = 'Expired'
        AND u.status = 'Active'
        AND up.id = (
          SELECT MAX(id)
          FROM user_packages
          WHERE user_id = u.id
        )
    `);
    const usersDeactivated = userResult.affectedRows;

    // 3️⃣ Deactivate active assignments for newly inactive patients
    const [assignmentResult] = await connection.query(`
      UPDATE patient_assignments pa
      JOIN user u ON pa.patientId = u.id
      SET pa.status = 'Cancelled', pa.endedOn = NOW()
      WHERE u.status = 'Inactive'
        AND pa.status = 'Active'
    `);
    const assignmentsDeactivated = assignmentResult.affectedRows;

    // If all queries were successful, commit the transaction
    await connection.commit();

    // 🧾 Log the results
    console.log(`✅ Cron Job Summary:`);
    console.log(`   - Packages marked Expired: ${packagesUpdated}`);
    console.log(`   - Users Deactivated: ${usersDeactivated}`);
    console.log(`   - Assignments Deactivated: ${assignmentsDeactivated}`);

  } catch (err) {
    // If any query fails, roll back all the changes
    await connection.rollback();
    console.error("❌ Error deactivating expired patients; transaction rolled back:", err);
  } finally {
    // ALWAYS release the connection back to the pool
    connection.release();
  }
};

// Export the function so it can be run by your scheduler
module.exports = deactivateExpiredPatients;