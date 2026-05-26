const CaretakerDashboardModel = require("../models/caretakerdashboard.model");


const dashboardController = {
  async getDashboardData(req, res, next) {
    try {
      const { fromDate, toDate } = req.query;
      const userId = req.user.id;

      // ✅ ADD THESE 3 LINES
      console.log("FROM DATE:", fromDate);
      console.log("TO DATE:", toDate);
      console.log("USER ID:", userId);

      if (!fromDate || !toDate) {
        return res.status(400).json({ success: false, message: "Missing date parameters." });
      }

      const data = await CaretakerDashboardModel.getDashboardData(fromDate, toDate, userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("DASHBOARD_ERROR:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
  
module.exports = dashboardController;