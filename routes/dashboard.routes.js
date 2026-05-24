// dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

// All routes now primarily rely on query parameters (?year=YYYY&month=MM)

// Route to get overall total counts
// Example: /api/dashboard/total?year=2024&month=7
router.get('/total', dashboardController.getOverallCounts);

// Route to get weekly user counts (last 4 weeks) - KEPT UNFILTERED
router.get('/weekly', dashboardController.getWeeklyData);

// Route to get a daily breakdown for a specific month and year (for DailyVisitors chart)
// Example: /api/dashboard/monthly/2024/09 (Uses path params for this specific use case)
router.get('/monthly/:year/:month', dashboardController.getMonthlyData);

// Route to get a monthly breakdown of users for the current year
// Example: /api/dashboard/yearly?year=2024
router.get('/yearly', dashboardController.getYearlyData);

// Route to get a breakdown of hospitals, assigned doctors, and their assigned patients
// Example: /api/dashboard/hospital-breakdown?year=2024&month=7
router.get('/hospital-breakdown', dashboardController.getHospitalDoctorPatientDetails);

// Route to get all hospitals with their number of assigned patients
// Example: /api/dashboard/hospital-patients?year=2024&month=7
router.get('/hospital-patients', dashboardController.getHospitalPatientData);

// Route to get a breakdown of assigned patients by hospital and blood group
// Example: /api/dashboard/hospital-blood-group-breakdown?year=2024&month=7
router.get('/hospital-blood-group-breakdown', dashboardController.getHospitalPatientBloodGroupBreakdown);

// NEW Route to get a breakdown of assigned patients by hospital and gender
// Example: /api/dashboard/hospital-gender-breakdown?year=2024&month=7
router.get('/hospital-gender-breakdown', dashboardController.getHospitalPatientGenderBreakdownController);

// Route to get total patient gender breakdown (count and percentage) across all hospitals (supports optional hospitalId filter)
// Example: /api/dashboard/patients/gender-breakdown?year=2024&month=7&hospitalId=1
router.get('/patients/gender-breakdown', dashboardController.getTotalPatientGenderBreakdownController);

// Route to get total patient blood group breakdown (count and percentage) across all hospitals (supports optional hospitalId filter)
// Example: /api/dashboard/patients/blood-group-total-breakdown?year=2024&month=7&hospitalId=1
router.get('/patients/blood-group-total-breakdown', dashboardController.getTotalPatientBloodGroupBreakdownController);

// --- OTHER NEW ROUTES ---

// Route to get total patient breakdown by doctor's specialization (count)
// Example: /api/dashboard/patients/specialization-breakdown?year=2024&month=7
router.get('/patients/specialization-breakdown', dashboardController.getPatientBreakdownBySpecializationController);

// Route to get total patient breakdown by age group (count)
// Example: /api/dashboard/patients/age-breakdown?year=2024&month=7
router.get('/patients/age-breakdown', dashboardController.getPatientBreakdownByAgeController);

// NEW: Route to get total doctor breakdown by specialization (count) (Global)
// Example: /api/dashboard/doctors/specialization-breakdown?year=2024&month=7
router.get('/doctors/specialization-breakdown', dashboardController.getDoctorsBySpecializationController);


module.exports = router;