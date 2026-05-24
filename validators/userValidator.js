const db = require("../config/db");

async function validateField(query, value, fieldName) {
  const [rows] = await db.query(query, [value]);
  if (rows.length === 0) {
    throw new Error(`Invalid ${fieldName}`);
  }
}

// MAIN VALIDATION FUNCTION
async function validateUser(req, res, next) {
  try {
    const {
      city,
      state,
      area,
      zipcode,
      language,
      specialization
    } = req.body;

    // Location validations
    if (city) {
      await validateField(
        "SELECT 1 FROM locationdata WHERE city = ? LIMIT 1",
        city,
        "city"
      );
    }

    if (state) {
      await validateField(
        "SELECT 1 FROM locationdata WHERE state = ? LIMIT 1",
        state,
        "state"
      );
    }

    if (area) {
      await validateField(
        "SELECT 1 FROM locationdata WHERE area = ? LIMIT 1",
        area,
        "area"
      );
    }

    if (zipcode) {
      await validateField(
        "SELECT 1 FROM locationdata WHERE zipcode = ? LIMIT 1",
        zipcode,
        "zipcode"
      );
    }

    // Language validation
    if (language) {
      await validateField(
        "SELECT 1 FROM languages WHERE name = ? LIMIT 1",
        language,
        "language"
      );
    }

    // Specialization validation
    if (specialization) {
      await validateField(
        "SELECT 1 FROM specializations WHERE name = ? LIMIT 1",
        specialization,
        "specialization"
      );
    }

    next();
  } catch (err) {
    return res.status(400).json({
      message: err.message
    });
  }
}

module.exports = validateUser;