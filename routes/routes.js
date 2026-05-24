const express = require("express");
const router = express.Router();

// ✅ ROUTES (all fixed naming)

const authRoutes = require("./auth.routes");
const userRoleRoutes = require("./userRole.routes");
const roleRoutes = require("./role.routes");
const permissionRoutes = require("./permission.routes");
const rolePermissionRoutes = require("./rolePermission.routes");

const patientVitalsRoutes = require("./patientVitals.routes");
const patientRoutes = require("./patient.routes");
const patientAssignmentRoutes = require("./patientAssign.routes");
const patientChartRoutes = require("./patientChart.routes");
const patientAnalyticsRoutes = require("./patient_analytics.routes");

const userDocumentRoutes = require("./userDocument.routes");
const userManagementRoutes = require("./userManagement.routes");

const assignedCoachRoutes = require("./assignedCoach.routes");
const assignedDoctorRoutes = require("./assignedDoctor.routes");

const doctorAvailabilityRoutes = require("./doctorAvailability.routes");
const doctorDashboardRoutes = require("./doctordashboard.routes");

const hospitalRoutes = require("./hospital.routes");
const hospitalAdminRoutes = require("./hospitalAdmin.routes");
const hospitalUserRoutes = require("./hospitalUser.routes");
const hospitalUpdateRoutes = require("./hospitalUpdate.routes");
const hospitalDashboardRoutes = require("./hospitalDashboard.routes");

const assignHospitalRoutes = require("./assignHospital.routes");

const adminDocRoutes = require("./admindoc.routes");
const adminPatientRoutes = require("./adminpatient.routes");
const adminHospitalRoutes = require("./adminhospital.routes");
const adminNurseRoutes = require("./adminnurse.routes");
const adminAddRoutes = require("./adminadd.routes");
const adminRoleRoutes = require("./adminRole.routes");
const adminRoutes = require("./admin.routes");
const hosdocRoutes = require("./hosdoc.routes");
const hospatientRoutes = require("./hospatient.routes");
const taskRoutes = require("./task.routes");
const medicineAssignmentRoutes = require("./medicineAssignment.routes");
const medicationIntakeRoutes = require("./medicationIntake.routes");
const sendAlertRoutes = require("./sendAlert.routes");
const responseRoutes = require("./response.routes");
const locationRoutes = require("./location.routes");
const totalCountsRoutes = require("./totalCounts.routes");
const totalDocAndPatRoutes = require("./totalDocAndPat.routes");
const dashboardRoutes = require("./dashboard.routes");
const patientDashboardRoutes = require("./patientDashboard.routes");
const caretakerDashboardRoutes = require("./caretakerdashboard.routes");
const chatRoutes = require("./chats.routes");
const packageRoutes = require("./package.routes");
const aiRoutes = require("./ai.routes");
const callRoutes = require("./call.routes");
const woundRoutes = require("./wound.routes");
const Notifications = require("./notification.routes");
const communicationSettingsRoutes = require("./communicationSettings.routes");
const providerRoutes = require("./provider.routes");
const templateRoutes = require("./template.routes");
const notificationAdminRoutes = require("./notificationAdmin.routes");

// ✅ MOUNT ROUTES

router.use("/auth", authRoutes);
router.use("/user-roles", userRoleRoutes);
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/role-permissions", rolePermissionRoutes);
router.use("/patient-vitals", patientVitalsRoutes);
router.use("/patients", patientRoutes);
router.use("/patient-assignments", patientAssignmentRoutes);
router.use("/patient-charts", patientChartRoutes);
router.use("/analytics", patientAnalyticsRoutes);
router.use("/user-documents", userDocumentRoutes);
router.use("/user-management", userManagementRoutes);
router.use("/assigned-coach", assignedCoachRoutes);
router.use("/assigned-doctor", assignedDoctorRoutes);

router.use("/doctor-availability", doctorAvailabilityRoutes);
router.use("/doctor-dashboard", doctorDashboardRoutes);

router.use("/hospitals", hospitalRoutes);
router.use("/hospital-admin", hospitalAdminRoutes);
router.use("/hospital-users", hospitalUserRoutes);
router.use("/hospital-update", hospitalUpdateRoutes);
router.use("/hospital-dashboard", hospitalDashboardRoutes);

router.use("/assign-hospital", assignHospitalRoutes);

router.use("/admin/communication-settings", communicationSettingsRoutes);
router.use("/admin/providers", providerRoutes);
router.use("/admin/templates", templateRoutes);
router.use("/admin/notifications", notificationAdminRoutes);

router.use("/admin", adminDocRoutes);
router.use("/admin", adminPatientRoutes);
router.use("/admin", adminHospitalRoutes);
router.use("/admin", adminNurseRoutes);
router.use("/admin", adminAddRoutes);
router.use("/admin", adminRoutes);
router.use("/admin-role", adminRoleRoutes);

router.use("/hosdoc", hosdocRoutes);
router.use("/hospatient", hospatientRoutes);

router.use("/tasks", taskRoutes);
router.use("/medicine-assignments", medicineAssignmentRoutes);
router.use("/medication-intake", medicationIntakeRoutes);

router.use("/send-alert", sendAlertRoutes);
router.use("/notifications", Notifications );

router.use("/responses", responseRoutes);


router.use("/locations", locationRoutes);

router.use("/total-counts", totalCountsRoutes);
router.use("/total-doc-pat", totalDocAndPatRoutes);

router.use("/dashboard", dashboardRoutes);
router.use("/patient-dashboard", patientDashboardRoutes);
router.use("/caretaker-dashboard", caretakerDashboardRoutes);

router.use("/communication", chatRoutes);
router.use("/packages", packageRoutes);
router.use("/ai", aiRoutes);
router.use("/calls", callRoutes);

router.use("/wounds", woundRoutes);

module.exports = router;