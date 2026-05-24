const PatientDashboardModel = require("../models/PatientDashboard.model");

const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const getVitalStatus = (vital, value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return "Info";

  switch (vital) {
    case "Heart Rate":
      return num >= 60 && num <= 100 ? "Normal" : num <= 120 ? "Moderate" : "Critical";
    case "Blood Pressure":
      return num >= 90 && num <= 140 ? "Normal" : num <= 160 ? "Moderate" : "Critical";
    case "Oxygen Saturation":
      return num >= 95 ? "Normal" : num >= 90 ? "Moderate" : "Critical";
    case "Temperature":
      return num >= 97.7 && num <= 99.5 ? "Normal" : num <= 101 ? "Moderate" : "Critical";
    default:
      return "Normal";
  }
};

const patientDashboardController = {
  async getDashboardData(req, res, next) {
    try {
      const { patientId } = req.params;

      if (!patientId) {
        return res.status(400).json({ message: "Missing patient ID" });
      }

      const rawData = await PatientDashboardModel.getDashboardData(patientId);

      // ✅ FIXED vitals
      const vitalMap = [
        { title: "Heart Rate", key: "heartRate", unit: "bpm" },
        { title: "Blood Pressure", key: "bloodPressure", unit: "mmHg" },
        { title: "Oxygen Saturation", key: "oxygenSaturation", unit: "%" },
        { title: "Temperature", key: "temperature", unit: "°F" },
      ];

      const vitalsConfigWithStatus = vitalMap.map(v => {
        const value = rawData.vitalsConfig?.[v.key];
        return {
          title: v.title,
          value,
          unit: v.unit,
          status: getVitalStatus(v.title, value),
          icon: v.title,
          trend: "—",
        };
      });

      // ✅ alerts safe
      const alertsData = rawData.alertsData.map(alert => ({
        type: capitalizeFirstLetter(alert.severity),
        title: `Issue #${alert.id} - ${capitalizeFirstLetter(alert.status)}`,
        message: alert.description,
        time: alert.raisedOn
          ? new Date(alert.raisedOn).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "N/A",
        sender: alert.coachName || alert.doctorName || "User",
      }));

      // ✅ no duplicate logic
      const medicines = rawData.medicines;

      const finalData = {
        patientData: rawData.patientData,
        vitalsConfig: vitalsConfigWithStatus,
        alertsData,
        todaysTasks: rawData.todaysTasks,
        medicines,
        dailyVitalsHistory: rawData.dailyVitalsHistory,
        monthlyVitalsHistory: rawData.monthlyVitalsHistory,
      };

      res.status(200).json({
        success: true,
        message: "Patient Dashboard data fetched successfully",
        data: finalData,
      });

    } catch (error) {
      console.error("Error fetching dashboard:", error);

      if (
        error.message.includes("Invalid Patient ID") ||
        error.message.includes("inactive")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      next(error);
    }
  },
};

module.exports = patientDashboardController;