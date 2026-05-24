const db = require('../config/db');

class Task {

  // =========================
  // CREATE TASK
  // =========================
  static async createTask(taskData) {
    const { title, description, videoUrl, dueDate, assignedTo, assignedBy } = taskData;

    const [result] = await db.query(
      `INSERT INTO tasks 
       (title, description, videoUrl, due_date, assigned_to, assigned_by, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, description, videoUrl, dueDate, assignedTo, assignedBy, "pending"]
    );

    return { id: result.insertId, ...taskData, status: "pending" };
  }

  // =========================
  // GET TASKS FOR PATIENT
  // =========================
  static async getTasksByAssignedToId(patientId) {
    const [rows] = await db.query(
      `SELECT * FROM tasks 
       WHERE assigned_to = ?
       ORDER BY created_at DESC`,
      [patientId]
    );
    return rows;
  }

  // =========================
  // GET TASKS FOR CARETAKER
  // =========================
  static async getTasksByAssignedById(caretakerId) {
    const [rows] = await db.query(
      `SELECT
         t.*,
         u.name AS patientName
       FROM tasks t
       JOIN user u ON t.assigned_to = u.id
       WHERE t.assigned_by = ?
       ORDER BY t.created_at DESC`,
      [caretakerId]
    );
    return rows;
  }

  // =========================
  // GET SINGLE TASK
  // =========================
  static async getTaskById(taskId) {
    const [rows] = await db.query(
      `SELECT * FROM tasks WHERE id = ?`,
      [taskId]
    );
    return rows[0] || null;
  }

  // =========================
  // UPDATE TASK (GENERAL)
  // =========================
  static async updateTask(taskId, taskData) {
    const { title, description, videoUrl, dueDate, status, assignedTo } = taskData;

    const validStatuses = ["pending", "in_progress", "completed"];

    if (status && !validStatuses.includes(status.toLowerCase())) {
      throw new Error("Invalid status value");
    }

    await db.query(
      `UPDATE tasks
       SET title = ?, description = ?, videoUrl = ?, due_date = ?, status = ?, assigned_to = ?, updated_at = NOW()
       WHERE id = ?`,
      [title, description, videoUrl, dueDate, status, assignedTo, taskId]
    );

    return { id: taskId, ...taskData };
  }

  // =========================
  // UPDATE TASK STATUS (SMART)
  // =========================
  static async updateTaskStatus(taskId, newStatus) {

    const validStatuses = ["pending", "in_progress", "completed"];
    newStatus = newStatus.toLowerCase();

    if (!validStatuses.includes(newStatus)) {
      throw new Error("Invalid status value");
    }

    const task = await this.getTaskById(taskId);
    if (!task) throw new Error("Task not found");

    const currentStatus = task.status?.toLowerCase();

    // Prevent useless updates
    if (currentStatus === newStatus) {
      return { message: "No change in status" };
    }

    // =========================
    // STATUS TRANSITIONS
    // =========================
    if (newStatus === "in_progress" && currentStatus === "pending") {
      await db.query(
        `UPDATE tasks 
         SET status = ?, started_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        ["in_progress", taskId]
      );
    }

    else if (newStatus === "completed") {
      await db.query(
        `UPDATE tasks 
         SET status = ?, completed_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        ["completed", taskId]
      );
    }

    else if (newStatus === "pending") {
      // optional reset
      await db.query(
        `UPDATE tasks 
         SET status = ?, started_at = NULL, completed_at = NULL, updated_at = NOW()
         WHERE id = ?`,
        ["pending", taskId]
      );
    }

    else {
      throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
    }

    return { message: "Task status updated successfully." };
  }

  // =========================
  // DELETE TASK
  // =========================
  static async deleteTask(taskId) {
    await db.query(`DELETE FROM tasks WHERE id = ?`, [taskId]);
    return { message: 'Task deleted successfully' };
  }

  // =========================
  // GET PATIENT ID BY NAME
  // =========================
  static async getPatientIdByName(patientName) {
    const [rows] = await db.query(
      `SELECT u.id
       FROM user u
       JOIN userrole ur ON u.id = ur.userId
       JOIN roles r ON ur.roleId = r.id
       WHERE u.name = ? AND LOWER(r.roleName) = 'patient'`,
      [patientName]
    );
    return rows[0] ? rows[0].id : null;
  }

  // =========================
  // GET ALL TASKS
  // =========================
  static async getAllTasks() {
    const [rows] = await db.query(
      `SELECT * FROM tasks ORDER BY created_at DESC`
    );
    return rows;
  }
}

module.exports = Task;