const Responses = require("../models/response.model");

// Get all alerts that have a response
const getAllResponses = async (req, res) => {
  try {

    const responses = await Responses.getAllResponses();

    res.status(200).json({
      success: true,
      message: "Responses fetched successfully",
      data: responses,
    });

  } catch (error) {

    console.error("Get all responses error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch responses",
      error: error.message,
    });

  }
};

// Get responses by patient ID
const getResponsesByPatientId = async (req, res) => {
  try {

    const responses =
      await Responses.getResponsesByPatientId(
        req.params.patientId
      );

    res.status(200).json({
      success: true,
      message: "Responses fetched for patient",
      data: responses,
    });

  } catch (error) {

    console.error(
      "Get responses by patient error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch responses for patient",
      error: error.message,
    });

  }
};

// Get a single response by alert ID
const getResponseByAlertId = async (req, res) => {
  try {

    const response =
      await Responses.getResponseByIssueId(
        req.params.id
      );

    if (response) {

      res.status(200).json({
        success: true,
        message: "Response fetched successfully",
        data: response,
      });

    } else {

      res.status(404).json({
        success: false,
        message: "Response not found",
      });

    }

  } catch (error) {

    console.error(
      "Get response by ID error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch response",
      error: error.message,
    });

  }
};

// Add a response and update alert status
const addResponse = async (req, res) => {
  try {

    const { responseNote } = req.body;

    const result =
      await Responses.addResponse(
        req.params.id,
        responseNote,
        "completed"
      );

    if (result) {

      res.status(200).json({
        success: true,
        message: "Response added successfully",
      });

    } else {

      res.status(404).json({
        success: false,
        message: "Alert not found",
      });

    }

  } catch (error) {

    console.error(
      "Add response error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to add response",
      error: error.message,
    });

  }
};

module.exports = {
  getAllResponses,
  getResponsesByPatientId,
  getResponseByAlertId,
  addResponse,
};