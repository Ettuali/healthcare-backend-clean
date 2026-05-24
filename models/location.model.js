const db = require("../config/db");

// Create the LocationData model object.
const LocationData = function (location) {
  this.area = location.area;
  this.city = location.city;
  this.state = location.state;
  this.zipcode = location.zipcode;
};

// =============================================================================
// LOCATION CRUD
// =============================================================================

// 1. CREATE
LocationData.create = async (newLocation) => {
  try {
    const [result] = await db.query("INSERT INTO locationdata SET ?", newLocation);
    return { id: result.insertId, ...newLocation };
  } catch (err) {
    console.error("Error creating new location:", err);
    throw new Error("Failed to create new location due to a database error.");
  }
};

// 2. READ ALL
LocationData.getAll = async () => {
  try {
    const [rows] = await db.query("SELECT * FROM locationdata");
    return rows;
  } catch (err) {
    console.error("Error fetching all locations:", err);
    throw new Error("Failed to retrieve locations from the database.");
  }
};

// 3. READ ONE
LocationData.findById = async (id) => {
  try {
    const [rows] = await db.query("SELECT * FROM locationdata WHERE id = ?", [id]);
    return rows.length ? rows[0] : null;
  } catch (err) {
    console.error("Error fetching location by ID:", err);
    throw new Error(`Failed to find location by ID ${id} due to a database error.`);
  }
};

// 4. UPDATE
LocationData.updateById = async (id, location) => {
  try {
    const [result] = await db.query(
      "UPDATE locationdata SET area = ?, city = ?, state = ?, zipcode = ? WHERE id = ?",
      [location.area, location.city, location.state, location.zipcode, id]
    );
    if (result.affectedRows === 0) return null;
    return { id, ...location };
  } catch (err) {
    console.error("Error updating location:", err);
    throw new Error(`Failed to update location with ID ${id} due to a database error.`);
  }
};

// 5. DELETE
LocationData.remove = async (id) => {
  try {
    const [result] = await db.query("DELETE FROM locationdata WHERE id = ?", [id]);
    if (result.affectedRows === 0) return null;
    return { message: "Location deleted successfully!" };
  } catch (err) {
    console.error("Error deleting location:", err);
    throw new Error(`Failed to delete location with ID ${id} due to a database error.`);
  }
};

// =============================================================================
// CASCADING DROPDOWN QUERIES
// =============================================================================

LocationData.getUniqueStates = async () => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT state FROM locationdata WHERE state IS NOT NULL"
    );
    return rows.map((row) => row.state);
  } catch (err) {
    console.error("Error fetching unique states:", err);
    throw new Error("Failed to retrieve unique states from the database.");
  }
};

LocationData.getCitiesByState = async (state) => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT city FROM locationdata WHERE state = ? AND city IS NOT NULL",
      [state]
    );
    return rows.map((row) => row.city);
  } catch (err) {
    console.error(`Error fetching cities for state "${state}":`, err);
    throw new Error(`Failed to retrieve cities for state "${state}" from the database.`);
  }
};

LocationData.getAreasByCity = async (city) => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT area FROM locationdata WHERE city = ? AND area IS NOT NULL",
      [city]
    );
    return rows.map((row) => row.area);
  } catch (err) {
    console.error(`Error fetching areas for city "${city}":`, err);
    throw new Error(`Failed to retrieve areas for city "${city}" from the database.`);
  }
};

LocationData.getzipcodesByArea = async (area) => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT zipcode FROM locationdata WHERE area = ? AND zipcode IS NOT NULL",
      [area]
    );
    return rows.map((row) => row.zipcode);
  } catch (err) {
    console.error(`Error fetching zipcodes for area "${area}":`, err);
    throw new Error(`Failed to retrieve zipcodes for area "${area}" from the database.`);
  }
};

// =============================================================================
// LANGUAGE CRUD
// =============================================================================

// 1. CREATE
LocationData.addLanguage = async (name) => {
  try {
    const [result] = await db.query("INSERT INTO languages (name) VALUES (?)", [name]);
    return { id: result.insertId, name };
  } catch (err) {
    console.error("Error adding new language:", err);
    throw new Error("Failed to add new language due to a database error.");
  }
};

// 2. READ ALL
LocationData.getAllLanguages = async () => {
  try {
    const [rows] = await db.query("SELECT * FROM languages");
    return rows;
  } catch (err) {
    console.error("Error fetching all languages:", err);
    throw new Error("Failed to retrieve languages from the database.");
  }
};

// 3. READ ONE
LocationData.findLanguageById = async (id) => {
  try {
    const [rows] = await db.query("SELECT * FROM languages WHERE id = ?", [id]);
    return rows.length ? rows[0] : null;
  } catch (err) {
    console.error("Error fetching language by ID:", err);
    throw new Error(`Failed to find language by ID ${id} due to a database error.`);
  }
};

// 4. UPDATE
LocationData.updateLanguageById = async (id, name) => {
  try {
    const [result] = await db.query("UPDATE languages SET name = ? WHERE id = ?", [name, id]);
    if (result.affectedRows === 0) return null;
    return { id, name };
  } catch (err) {
    console.error("Error updating language:", err);
    throw new Error(`Failed to update language with ID ${id} due to a database error.`);
  }
};

// 5. DELETE
LocationData.removeLanguage = async (id) => {
  try {
    const [result] = await db.query("DELETE FROM languages WHERE id = ?", [id]);
    if (result.affectedRows === 0) return null;
    return { message: "Language deleted successfully!" };
  } catch (err) {
    console.error("Error deleting language:", err);
    throw new Error(`Failed to delete language with ID ${id} due to a database error.`);
  }
};

// =============================================================================
// SPECIALIZATION CRUD
// =============================================================================

// 1. CREATE
LocationData.addSpecialization = async (name) => {
  try {
    const [result] = await db.query("INSERT INTO specializations (name) VALUES (?)", [name]);
    return { id: result.insertId, name };
  } catch (err) {
    console.error("Error adding new specialization:", err);
    throw new Error("Failed to add new specialization due to a database error.");
  }
};

// 2. READ ALL
LocationData.getAllSpecializations = async () => {
  try {
    const [rows] = await db.query("SELECT * FROM specializations");
    return rows;
  } catch (err) {
    console.error("Error fetching all specializations:", err);
    throw new Error("Failed to retrieve specializations from the database.");
  }
};

// 3. READ ONE
LocationData.findSpecializationById = async (id) => {
  try {
    const [rows] = await db.query("SELECT * FROM specializations WHERE id = ?", [id]);
    return rows.length ? rows[0] : null;
  } catch (err) {
    console.error("Error fetching specialization by ID:", err);
    throw new Error(`Failed to find specialization by ID ${id} due to a database error.`);
  }
};

// 4. UPDATE
LocationData.updateSpecializationById = async (id, name) => {
  try {
    const [result] = await db.query("UPDATE specializations SET name = ? WHERE id = ?", [name, id]);
    if (result.affectedRows === 0) return null;
    return { id, name };
  } catch (err) {
    console.error("Error updating specialization:", err);
    throw new Error(`Failed to update specialization with ID ${id} due to a database error.`);
  }
};

// 5. DELETE
LocationData.removeSpecialization = async (id) => {
  try {
    const [result] = await db.query("DELETE FROM specializations WHERE id = ?", [id]);
    if (result.affectedRows === 0) return null;
    return { message: "Specialization deleted successfully!" };
  } catch (err) {
    console.error("Error deleting specialization:", err);
    throw new Error(`Failed to delete specialization with ID ${id} due to a database error.`);
  }
};

module.exports = LocationData;