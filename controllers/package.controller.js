const Package = require("../models/package.model");

// CREATE a new package
async function create(req, res) {
  try {
    const { name, duration_days, price, description } = req.body;

    if (!name || !duration_days || !price) {
      return res.status(400).json({ message: "name, duration_days, and price are required." });
    }

    const newPackage = { name, duration_days, price, description };
    const createdPackage = await Package.create(newPackage);

    res.status(201).json(createdPackage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET ALL active packages
async function findAll(req, res) {
  try {
    const packages = await Package.getAll();
    
    // 🚨 CRITICAL FIX: Wrap the package array in the success object
    res.status(200).json({ success: true, data: packages }); 
    
  } catch (err) {
    // Ensure error responses also contain 'success: false' for consistency
    console.error("Error fetching packages:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET ONE package by ID
async function findOne(req, res) {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: "Package not found" });
    res.status(200).json(pkg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// UPDATE a package
async function update(req, res) {
  try {
    const updatedPackage = await Package.updateById(req.params.id, req.body);
    if (!updatedPackage) return res.status(404).json({ message: "Package not found" });
    res.status(200).json(updatedPackage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// DELETE (soft delete) a package
async function remove(req, res) {
  try {
    const wasDeleted = await Package.remove(req.params.id);
    if (!wasDeleted) return res.status(404).json({ message: "Package not found" });
    res.status(200).json({ message: "Package deactivated successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { create, findAll, findOne, update, remove };