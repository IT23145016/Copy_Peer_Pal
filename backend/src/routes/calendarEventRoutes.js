const express = require("express");
const {
  createCalendarEvent,
  deleteAdminStudyRoomEvent,
  deleteUserQuickAdd,
  getCalendarAdminOverview,
  listCalendarEvents,
  updateCampusEvent,
  updateUserQuickAdd,
  deleteCampusEvent,
} = require("../controllers/calendarEventController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", auth, listCalendarEvents);
router.post("/", auth, createCalendarEvent);
router.put("/quick-add/:source/:id", auth, updateUserQuickAdd);
router.delete("/quick-add/:source/:id", auth, deleteUserQuickAdd);
router.get("/admin/overview", auth, authorizeRole("admin"), getCalendarAdminOverview);
router.delete("/admin/study-room/:source/:id", auth, authorizeRole("admin"), deleteAdminStudyRoomEvent);
router.put("/campus/:id", auth, authorizeRole("admin"), updateCampusEvent);
router.delete("/campus/:id", auth, authorizeRole("admin"), deleteCampusEvent);

module.exports = router;
