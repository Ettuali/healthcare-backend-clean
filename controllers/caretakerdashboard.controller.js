const CaretakerDashboardModel = require("../models/caretakerDashboard.model");

const dashboardController = {
  async getDashboardData(req, res, next) {
    try {
      const { year, month, date } = req.query;
      
      // Ensure this matches how your verifyToken middleware attaches the user
      const userId = req.user.id; 

      if (!year || !month || !date) {
        return res.status(400).json({ success: false, message: "Missing date parameters." });
      }

      const data = await CaretakerDashboardModel.getDashboardData(year, month, date, userId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      // THIS WILL TELL YOU EXACTLY WHY IT IS FAILING IN YOUR TERMINAL
      console.error("DASHBOARD_ERROR:", error); 
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
  
module.exports = dashboardController;