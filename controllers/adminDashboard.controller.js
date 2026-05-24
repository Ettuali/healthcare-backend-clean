// controllers/adminDashboard.controller.js

const AdminDashboardModel = require("../models/adminDashboard.model");

const adminDashboardController = {

  async getHospitalsByState(req, res) {
    try {
      const data = await AdminDashboardModel.getStateWiseStats();

      res.json({
        success: true,
        data
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  }

};

module.exports = adminDashboardController;