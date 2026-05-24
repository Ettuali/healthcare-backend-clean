const express = require("express");
const router = express.Router();
const locations = require("../controllers/location.controller");

// =============================================================================
// LOCATION ROUTES
// =============================================================================
// POST   /api/locations          → Create a new location
// GET    /api/locations          → Get all locations
// GET    /api/locations/:id      → Get a single location by ID
// PUT    /api/locations/:id      → Update a location by ID
// DELETE /api/locations/:id      → Delete a location by ID

router.post("/", locations.create);
router.get("/", locations.findAll);

// =============================================================================
// CASCADING DROPDOWN ROUTES
// (must be declared before /:id to avoid conflicts)
// =============================================================================
// GET /api/locations/states
// GET /api/locations/cities?state=Telangana
// GET /api/locations/areas?city=Hyderabad
// GET /api/locations/zipcodes?area=Banjara Hills

router.get("/states", locations.findStates);
router.get("/cities", locations.findCities);
router.get("/areas", locations.findAreas);
router.get("/zipcodes", locations.findzipcodes);

// =============================================================================
// LANGUAGE ROUTES
// =============================================================================
// POST   /api/locations/language       → Create a new language
// GET    /api/locations/language       → Get all languages
// GET    /api/locations/language/:id   → Get a single language by ID
// PUT    /api/locations/language/:id   → Update a language by ID
// DELETE /api/locations/language/:id   → Delete a language by ID

router.post("/language", locations.addLanguage);
router.get("/language", locations.getAllLanguages);
router.get("/language/:id", locations.getLanguageById);
router.put("/language/:id", locations.updateLanguage);
router.delete("/language/:id", locations.removeLanguage);

// =============================================================================
// SPECIALIZATION ROUTES
// =============================================================================
// POST   /api/locations/specialization       → Create a new specialization
// GET    /api/locations/specialization       → Get all specializations
// GET    /api/locations/specialization/:id   → Get a single specialization by ID
// PUT    /api/locations/specialization/:id   → Update a specialization by ID
// DELETE /api/locations/specialization/:id   → Delete a specialization by ID

router.post("/specialization", locations.addSpecialization);
router.get("/specialization", locations.getAllSpecializations);
router.get("/specialization/:id", locations.getSpecializationById);
router.put("/specialization/:id", locations.updateSpecialization);
router.delete("/specialization/:id", locations.removeSpecialization);

// =============================================================================
// LOCATION BY ID ROUTES (kept last to avoid swallowing named paths above)
// =============================================================================

router.get("/:id", locations.findOne);
router.put("/:id", locations.update);
router.delete("/:id", locations.remove);

module.exports = router;