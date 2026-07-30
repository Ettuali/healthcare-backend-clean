// services/medicineReminder.service.js

const dayjs = require("dayjs");

const MedicineReminder = require("../models/medicineReminder.model");
const { sendNotification } = require("./notification.service");

const REMINDER_TYPES = {
  BEFORE_2_MIN: "BEFORE_2_MIN",
  ON_TIME: "ON_TIME",
  MISSED_15: "MISSED_15",
  CARETAKER_30: "CARETAKER_30",
};

class MedicineReminderService {
  async run() {
    try {
      const schedules = await MedicineReminder.getActiveSchedules();

      const now = dayjs();
      const today = now.format("YYYY-MM-DD");

      for (const item of schedules) {
        const scheduleTime = dayjs(
          `${today} ${item.scheduleTime}`,
          "YYYY-MM-DD HH:mm:ss"
        );

        const diff = now.diff(scheduleTime, "minute");

        switch (diff) {
          // ======================================
          // 2 Minutes Before
          // ======================================
          case -2:
            await this.beforeReminder(item, today);
            break;

          // ======================================
          // Exact Time
          // ======================================
          case 0:
            await this.onTimeReminder(item, today);
            break;

          // ======================================
          // 15 Minutes Later
          // ======================================
          case 15:
            await this.pendingReminder(item, today);
            break;

          // ======================================
          // 30 Minutes Later
          // ======================================
          case 30:
            await this.caretakerReminder(item, today);
            break;

          default:
            break;
        }
      }
    } catch (err) {
      console.error("Medicine Reminder Cron:", err.message);
    }
  }

  // =======================================================
  // BEFORE 2 MIN
  // =======================================================

  async beforeReminder(item, today) {
    const exists = await MedicineReminder.hasReminderSent(
      item.assignmentId,
      item.scheduleId,
      REMINDER_TYPES.BEFORE_2_MIN,
      today
    );

    if (exists) return;

    await sendNotification({
      userId: item.patientId,

      type: "medicine_due_soon",

      referenceType: "medicine",

      referenceId: item.assignmentId,

      metadata: {
        assignmentId: item.assignmentId,
        scheduleId: item.scheduleId,
      },

      templateData: {
        medicineName: item.medicineName,
        dosage: item.dosage,
        time: item.scheduleTime,
      },
    });

    await MedicineReminder.markReminderSent(
      item.assignmentId,
      item.scheduleId,
      REMINDER_TYPES.BEFORE_2_MIN,
      today
    );
  }

  // =======================================================
  // ON TIME
  // =======================================================

  async onTimeReminder(item, today) {
    const exists = await MedicineReminder.hasReminderSent(
      item.assignmentId,
      item.scheduleId,
      REMINDER_TYPES.ON_TIME,
      today
    );

    if (exists) return;

    const taken = await MedicineReminder.isMedicineTaken(
      item.patientId,
      item.assignmentId,
      item.scheduleId,
      today
    );

    if (taken) return;

    await sendNotification({
      userId: item.patientId,

      type: "medicine_time",

      referenceType: "medicine",

      referenceId: item.assignmentId,

      metadata: {
        assignmentId: item.assignmentId,
        scheduleId: item.scheduleId,
      },

      templateData: {
        medicineName: item.medicineName,
        dosage: item.dosage,
        time: item.scheduleTime,
      },
    });

    await MedicineReminder.markReminderSent(
      item.assignmentId,
      item.scheduleId,
      REMINDER_TYPES.ON_TIME,
      today
    );
  }

  // =======================================================
  // 15 MIN LATER
  // =======================================================

  async pendingReminder(item, today) {
    const exists = await MedicineReminder.hasReminderSent(
      item.assignmentId,
      item.scheduleId,
      REMINDER_TYPES.MISSED_15,
      today
    );

    if (exists) return;

    const taken = await MedicineReminder.isMedicineTaken(
      item.patientId,
      item.assignmentId,
      item.scheduleId,
      today
    );

    if (taken) return;

    await sendNotification({
      userId: item.patientId,

      type: "medicine_pending",

      referenceType: "medicine",

      referenceId: item.assignmentId,

      metadata: {
        assignmentId: item.assignmentId,
        scheduleId: item.scheduleId,
      },

      templateData: {
        medicineName: item.medicineName,
        dosage: item.dosage,
        time: item.scheduleTime,
      },
    });

    await MedicineReminder.markReminderSent(
      item.assignmentId,
      item.scheduleId,
      REMINDER_TYPES.MISSED_15,
      today
    );
  }

  // =======================================================
  // 30 MIN LATER
  // =======================================================

  async caretakerReminder(item, today) {
    const exists = await MedicineReminder.hasReminderSent(
      item.assignmentId,
      item.scheduleId,
      REMINDER_TYPES.CARETAKER_30,
      today
    );

    if (exists) return;

    const taken = await MedicineReminder.isMedicineTaken(
      item.patientId,
      item.assignmentId,
      item.scheduleId,
      today
    );

    if (taken) return;

    if (!item.caretakerId) return;

    await sendNotification({
      userId: item.caretakerId,

      type: "medicine_missed",

      referenceType: "medicine",

      referenceId: item.assignmentId,

      metadata: {
        patientId: item.patientId,
        assignmentId: item.assignmentId,
        scheduleId: item.scheduleId,
      },

      templateData: {
        medicineName: item.medicineName,
        dosage: item.dosage,
        time: item.scheduleTime,
      },
    });

    await MedicineReminder.markReminderSent(
      item.assignmentId,
      item.scheduleId,
      REMINDER_TYPES.CARETAKER_30,
      today
    );
  }
}

module.exports = new MedicineReminderService();