const db = require("../config/db");

const Package = {};

// CREATE a new package
Package.create = async (pkg) => {
  const { name, duration_days, price, description } = pkg;
  const [result] = await db.query(
    "INSERT INTO packages (name, duration_days, price, description) VALUES (?, ?, ?, ?)",
    [name, duration_days, price, description]
  );
  return { id: result.insertId, ...pkg };
};

// GET all active packages
Package.getAll = async () => {
  const [rows] = await db.query(
    "SELECT id, name, duration_days, price, description FROM packages WHERE is_active = TRUE"
  );
  return rows;
};

// GET a single package by its ID
Package.findById = async (id) => {
  const [rows] = await db.query("SELECT * FROM packages WHERE id = ?", [id]);
  return rows.length ? rows[0] : null;
};

// UPDATE an existing package
Package.updateById = async (id, pkg) => {
  const { name, duration_days, price, description } = pkg;
  const [result] = await db.query(
    "UPDATE packages SET name = ?, duration_days = ?, price = ?, description = ? WHERE id = ?",
    [name, duration_days, price, description, id]
  );
  return result.affectedRows ? { id, ...pkg } : null;
};

// SOFT DELETE a package (set is_active to false)
Package.remove = async (id) => {
  const [result] = await db.query(
    "UPDATE packages SET is_active = FALSE WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
};

module.exports = Package;