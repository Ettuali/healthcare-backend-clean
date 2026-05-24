const LocationData = require("../models/location.model");

// Helper function to remove null values from an object
function removeNulls(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== null));
}

// =============================================================================
// LOCATION CRUD
// =============================================================================

// POST /api/locations
async function create(req, res) {
  if (!req.body) return res.status(400).json({ message: "Content cannot be empty!" });
  try {
    const newLocation = {
      area: req.body.area,
      city: req.body.city,
      state: req.body.state,
      zipcode: req.body.zipcode,
    };
    const created = await LocationData.create(newLocation);
    res.status(201).json(removeNulls(created));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/locations
async function findAll(req, res) {
  try {
    const locations = await LocationData.getAll();
    res.status(200).json(locations.map(removeNulls));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/locations/:id
async function findOne(req, res) {
  try {
    const location = await LocationData.findById(req.params.id);
    if (!location)
      return res.status(404).json({ message: `Location with ID ${req.params.id} not found.` });
    res.status(200).json(removeNulls(location));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// PUT /api/locations/:id
async function update(req, res) {
  if (!req.body) return res.status(400).json({ message: "Content cannot be empty!" });
  try {
    const updated = await LocationData.updateById(req.params.id, req.body);
    if (!updated)
      return res.status(404).json({ message: `Location with ID ${req.params.id} not found.` });
    res.status(200).json(removeNulls(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// DELETE /api/locations/:id
async function remove(req, res) {
  try {
    const result = await LocationData.remove(req.params.id);
    if (!result)
      return res.status(404).json({ message: `Location with ID ${req.params.id} not found.` });
    res.status(200).json({ message: "Location deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// =============================================================================
// CASCADING DROPDOWN CONTROLLERS
// =============================================================================

// GET /api/locations/states
async function findStates(req, res) {
  try {
    const states = await LocationData.getUniqueStates();
    res.status(200).json(states);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/locations/cities?state=
async function findCities(req, res) {
  if (!req.query.state)
    return res.status(400).json({ message: "State parameter is required." });
  try {
    const cities = await LocationData.getCitiesByState(req.query.state);
    res.status(200).json(cities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/locations/areas?city=
async function findAreas(req, res) {
  if (!req.query.city)
    return res.status(400).json({ message: "City parameter is required." });
  try {
    const areas = await LocationData.getAreasByCity(req.query.city);
    res.status(200).json(areas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/locations/zipcodes?area=
async function findzipcodes(req, res) {
  if (!req.query.area)
    return res.status(400).json({ message: "Area parameter is required." });
  try {
    const zipcodes = await LocationData.getzipcodesByArea(req.query.area);
    res.status(200).json(zipcodes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// =============================================================================
// LANGUAGE CRUD
// =============================================================================

// POST /api/locations/language
async function addLanguage(req, res) {
  if (!req.body.name)
    return res.status(400).json({ message: "Language name cannot be empty!" });
  try {
    const created = await LocationData.addLanguage(req.body.name);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/locations/language
async function getAllLanguages(req, res) {
  try {
    const languages = await LocationData.getAllLanguages();
    res.status(200).json(languages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/locations/language/:id
async function getLanguageById(req, res) {
  try {
    const language = await LocationData.findLanguageById(req.params.id);
    if (!language)
      return res.status(404).json({ message: `Language with ID ${req.params.id} not found.` });
    res.status(200).json(language);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// PUT /api/locations/language/:id
async function updateLanguage(req, res) {
  if (!req.body.name)
    return res.status(400).json({ message: "Language name cannot be empty!" });
  try {
    const updated = await LocationData.updateLanguageById(req.params.id, req.body.name);
    if (!updated)
      return res.status(404).json({ message: `Language with ID ${req.params.id} not found.` });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// DELETE /api/locations/language/:id
async function removeLanguage(req, res) {
  try {
    const result = await LocationData.removeLanguage(req.params.id);
    if (!result)
      return res.status(404).json({ message: `Language with ID ${req.params.id} not found.` });
    res.status(200).json({ message: "Language deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// =============================================================================
// SPECIALIZATION CRUD
// =============================================================================

// POST /api/locations/specialization
async function addSpecialization(req, res) {
  if (!req.body.name)
    return res.status(400).json({ message: "Specialization name cannot be empty!" });
  try {
    const created = await LocationData.addSpecialization(req.body.name);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/locations/specialization
async function getAllSpecializations(req, res) {
  try {
    const specializations = await LocationData.getAllSpecializations();
    res.status(200).json(specializations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/locations/specialization/:id
async function getSpecializationById(req, res) {
  try {
    const specialization = await LocationData.findSpecializationById(req.params.id);
    if (!specialization)
      return res
        .status(404)
        .json({ message: `Specialization with ID ${req.params.id} not found.` });
    res.status(200).json(specialization);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// PUT /api/locations/specialization/:id
async function updateSpecialization(req, res) {
  if (!req.body.name)
    return res.status(400).json({ message: "Specialization name cannot be empty!" });
  try {
    const updated = await LocationData.updateSpecializationById(req.params.id, req.body.name);
    if (!updated)
      return res
        .status(404)
        .json({ message: `Specialization with ID ${req.params.id} not found.` });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// DELETE /api/locations/specialization/:id
async function removeSpecialization(req, res) {
  try {
    const result = await LocationData.removeSpecialization(req.params.id);
    if (!result)
      return res
        .status(404)
        .json({ message: `Specialization with ID ${req.params.id} not found.` });
    res.status(200).json({ message: "Specialization deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  // Location
  create,
  findAll,
  findOne,
  update,
  remove,
  // Cascading dropdowns
  findStates,
  findCities,
  findAreas,
  findzipcodes,
  // Language
  addLanguage,
  getAllLanguages,
  getLanguageById,
  updateLanguage,
  removeLanguage,
  // Specialization
  addSpecialization,
  getAllSpecializations,
  getSpecializationById,
  updateSpecialization,
  removeSpecialization,
};