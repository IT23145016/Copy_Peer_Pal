const express = require("express");
const { createAssignment, listAssignments, updateAssignmentProgress, deleteAssignment } = require("../controllers/assignmentController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", auth, listAssignments);
router.post("/", auth, authorizeRole("admin"), createAssignment);
router.patch("/:id/progress", auth, updateAssignmentProgress);
router.delete("/:id", auth, authorizeRole("admin"), deleteAssignment);

module.exports = router;
