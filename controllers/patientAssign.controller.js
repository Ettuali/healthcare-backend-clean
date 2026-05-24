const PatientAssignment = require("../models/patientAssign.model");
const cryptoService = require("../services/crypto.service");

const PatientAssignmentController = {
  // 1. GET ALL
  getAllAssignments: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const search = req.query.search || "";
      const result = await PatientAssignment.getAllAssignments({ page, limit, search });
      res.status(200).json({ success: true, ...result.meta, data: result.data });
    } catch (error) { next(error); }
  },

  // 2. GET BY USER
getAssignmentsByUserId: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Extract and validate pagination parameters
      const page = Math.max(1, parseInt(req.query.page, 10) || 1); 
      const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
      const search = req.query.search || "";
      const sortBy = req.query.sortBy || "assignedOn";
      const order = req.query.order || "DESC";

      const result = await PatientAssignment.getAssignmentsByUserIdPaginated({ 
        userId, 
        page, 
        limit, 
        search, 
        sortBy, 
        order 
      });

      res.status(200).json({ 
        success: true, 
        ...result.meta, // Added meta to response for frontend awareness
        data: result.data 
      });
    } catch (error) { next(error); }
  },

  // 3. CREATE
  createAssignment: async (req, res, next) => {
    try {
      const { patientId, doctorId, caretakerId } = req.body;
      const newAssignment = await PatientAssignment.createOrUpdateAssignment(patientId, doctorId, caretakerId);
      res.status(201).json({ message: "Created successfully!", data: newAssignment });
    } catch (error) { next(error); }
  },

  // 4. GET SINGLE
  getAssignment: async (req, res, next) => {
    try {
      const assignment = await PatientAssignment.getAssignmentById(req.params.id);
      res.status(200).json(assignment);
    } catch (error) { next(error); }
  },

  // 5. UPDATE
  updateAssignment: async (req, res, next) => {
    try {
      const { patientId, doctorId, caretakerId } = req.body;
      const updated = await PatientAssignment.updateAssignment(req.params.id, patientId, doctorId, caretakerId);
      res.status(200).json({ message: "Updated!", data: updated });
    } catch (error) { next(error); }
  },

  // 6. DELETE
  deleteAssignment: async (req, res, next) => {
    try {
      await PatientAssignment.deleteAssignment(req.params.id);
      res.status(200).json({ message: "Deleted!" });
    } catch (error) { next(error); }
  },

  // 7. GET USERS BY HOSPITAL (This is what frontend is calling)
  getUsersByHospital: async (req, res, next) => {
    try {
      const { hospitalId } = req.params;
      const role = req.roleType; // From middleware
      const users = await PatientAssignment.getUsersByHospitalAndRole(hospitalId, role);
      res.status(200).json({ success: true, data: users });
    } catch (error) { next(error); }
  },

  // 8. OTHERS
  getAssignedPatientsByUserId: async (req, res, next) => {
    try {
      const patients = await PatientAssignment.getPatientsAssignedToUser(req.params.userId);
      res.status(200).json(patients);
    } catch (error) { next(error); }
  },

  getAssignmentsByHospital: async (req, res, next) => {
    try {
      const assignments = await PatientAssignment.getAssignmentsByHospital(req.user.id);
      res.status(200).json(assignments);
    } catch (error) { next(error); }
  },

  getAssignmentsByEncryptedId: async (req, res, next) => {
    try {
      const decryptedId = await cryptoService.decrypt(req.params.encryptedId, "authentication");
      const assignments = await PatientAssignment.getAssignmentsForPatient(decryptedId);
      res.status(200).json({ success: true, data: assignments });
    } catch (error) { next(error); }
  }
};

module.exports = PatientAssignmentController;
