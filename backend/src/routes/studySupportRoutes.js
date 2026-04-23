const express = require("express");
const {
  createBatchTopRequest,
  createProposedSession,
  deleteBatchTopRequest,
  listBatchTopPendingGroups,
  listBatchTopSessions,
  listBatchTops,
  cancelStudySession,
  createSessionFromProposal,
  deleteProposedSession,
  getProposedSession,
  getStudySession,
  listMyBatchTopRequests,
  listProposedSessions,
  setProposedSessionMeetingLink,
  startBatchTopSession,
  updateStudySession,
  updateBatchTopRequest,
  updateProposedSession,
  voteProposedSession,
} = require("../controllers/studySupportController");
const { auth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/batch-tops", auth, listBatchTops);
router.post("/requests", auth, createBatchTopRequest);
router.get("/requests/my", auth, listMyBatchTopRequests);
router.put("/requests/:id", auth, updateBatchTopRequest);
router.delete("/requests/:id", auth, deleteBatchTopRequest);
router.get("/batch-top/pending-groups", auth, listBatchTopPendingGroups);
router.post("/sessions/start", auth, startBatchTopSession);
router.get("/sessions", auth, listBatchTopSessions);
router.get("/sessions/:id", auth, getStudySession);
router.put("/sessions/:id", auth, updateStudySession);
router.delete("/sessions/:id", auth, cancelStudySession);

router.post("/proposals", auth, createProposedSession);
router.get("/proposals", auth, listProposedSessions);
router.get("/proposals/:id", auth, getProposedSession);
router.put("/proposals/:id", auth, updateProposedSession);
router.delete("/proposals/:id", auth, deleteProposedSession);
router.post("/proposals/:id/vote", auth, voteProposedSession);
router.post("/proposals/:id/meeting-link", auth, setProposedSessionMeetingLink);
router.post("/proposals/:id/create-session", auth, createSessionFromProposal);

module.exports = router;
