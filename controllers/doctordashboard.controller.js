const DashboardModel = require("../models/doctordashboard.model");

const dashboardController = {
  async getDashboardData(req, res, next) {
    try {
      const { year, month, date } = req.query;
      const userId = req.user.id; // from auth middleware

      if (!year || !month || !date) {
        return res.status(400).json({ message: "Missing required date parameters." });
      }

      const data = await DashboardModel.getDashboardData(year, month, date, userId);
      res.status(200).json({
        success: true,
        message: "Dashboard data fetched successfully",
        data,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      next(error);
    }
  },
};

module.exports = dashboardController;
