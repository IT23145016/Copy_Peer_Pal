const express = require("express");
const {
  createCalendarEvent,
  deleteAdminStudyRoomEvent,
  getCalendarAdminOverview,
  listCalendarEvents,
} = require("../controllers/calendarEventController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", auth, listCalendarEvents);
router.post("/", auth, createCalendarEvent);
router.get("/admin/overview", auth, authorizeRole("admin"), getCalendarAdminOverview);
router.delete("/admin/study-room/:source/:id", auth, authorizeRole("admin"), deleteAdminStudyRoomEvent);

module.exports = router;
