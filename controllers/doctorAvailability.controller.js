const DoctorAvailability = require("../models/doctorAvailability.model");

// Check doctor availability
const checkAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({ success: false, message: "Doctor ID is required" });
    }

    const availability = await DoctorAvailability.checkAvailability(doctorId);

    if (!availability) {
      return res.status(404).json({ success: false, message: "No availability found for this doctor" });
    }

    res.status(200).json({ success: true, data: availability });
  } catch (err) {
    console.error("Check availability error:", err);
    res.status(500).json({ success: false, message: "Server error checking availability" });
  }
};

// Update doctor timings
const updateTimings = async (req, res) => {
  try {
    const { doctorId, inTime, outTime } = req.body;

    if (!doctorId || !inTime || !outTime) {
      return res.status(400).json({ success: false, message: "doctorId, inTime, and outTime are required" });
    }

    await DoctorAvailability.updateTimings(doctorId, inTime, outTime);

    res.status(200).json({ success: true, message: "Doctor availability updated successfully" });
  } catch (err) {
    console.error("Update timings error:", err);
    res.status(500).json({ success: false, message: "Server error updating timings" });
  }
};

// Delete doctor timings
const deleteTimings = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({ success: false, message: "Doctor ID is required" });
    }

    await DoctorAvailability.deleteTimings(doctorId);

    res.status(200).json({ success: true, message: "Doctor availability deleted successfully" });
  } catch (err) {
    console.error("Delete timings error:", err);
    res.status(500).json({ success: false, message: "Server error deleting timings" });
  }
};

module.exports = {
  checkAvailability,
  updateTimings,
  deleteTimings,
};
