const db = require("../config/db");
const SendAlert = require("./sendAlert.model");

const Responses = {

  // Get all alerts that have a response
  getAllResponses: async () => {

    const [rows] = await db.query(
      `SELECT * FROM raisedissues 
       WHERE response IS NOT NULL 
       AND response != ''`
    );

    return rows;
  },

  // Get alerts by patientId that have a response
  getResponsesByPatientId: async (patientId) => {

    const [rows] = await db.query(
      `SELECT * FROM raisedissues 
       WHERE userId = ? 
       AND response IS NOT NULL 
       AND response != ''`,
      [patientId]
    );

    return rows;
  },

  // Get a single response by alert ID
  getResponseByIssueId: async (id) => {

    const [rows] = await db.query(
      `SELECT response 
       FROM raisedissues 
       WHERE id = ? 
       AND response IS NOT NULL 
       AND response != ''`,
      [id]
    );

    return rows[0];
  },

  // Add response to existing alert
  addResponse: async (id, responseText, status) => {

    const result = await SendAlert.changeAlertStatus(
      id,
      {
        response: responseText,
        status: status,
      },
      new Date()
    );

    return result;
  },
};

module.exports = Responses;