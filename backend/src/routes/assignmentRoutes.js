const express = require("express");
const {
  createAssignment,
  listAssignments,
  getAssignmentById,
  updateAssignmentProgress,
  updateAssignment,
  deleteAssignment,
} = require("../controllers/assignmentController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", auth, listAssignments);
router.post("/", auth, authorizeRole("admin"), createAssignment);
router.get("/:id", auth, getAssignmentById);
router.put("/:id", auth, authorizeRole("admin"), updateAssignment);
router.patch("/:id/progress", auth, updateAssignmentProgress);
router.delete("/:id", auth, authorizeRole("admin"), deleteAssignment);

module.exports = router;
