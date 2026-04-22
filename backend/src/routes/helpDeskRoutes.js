const express = require("express");
const {
  approveHelpDocument,
  bookmarkHelpDocument,
  clearHelpRequestForMe,
  createHelpRequest,
  deleteHelpRequest,
  getLeaderboard,
  listBookmarkedHelpDocuments,
  listHelpRequests,
  listMyHelpRequests,
  removeBookmarkedHelpDocument,
  updateHelpRequest,
  uploadHelpDocument,
} = require("../controllers/helpDeskController");
const { auth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", auth, listHelpRequests);
router.get("/my", auth, listMyHelpRequests);
router.get("/leaderboard", auth, getLeaderboard);
router.get("/bookmarks", auth, listBookmarkedHelpDocuments);
router.post("/", auth, createHelpRequest);
router.put("/:id", auth, updateHelpRequest);
router.delete("/:id", auth, deleteHelpRequest);
router.delete("/bookmarks/:bookmarkId", auth, removeBookmarkedHelpDocument);
router.post("/:id/clear", auth, clearHelpRequestForMe);
router.post("/:id/documents", auth, uploadHelpDocument);
router.post("/:id/documents/:documentId/bookmark", auth, bookmarkHelpDocument);
router.post("/:id/documents/:documentId/approve", auth, approveHelpDocument);

module.exports = router;
