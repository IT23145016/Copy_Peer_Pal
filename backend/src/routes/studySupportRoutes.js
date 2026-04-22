const express = require("express");
const {
  createBatchTopRequest,
  createProposedSession,
  listBatchTopPendingGroups,
  listBatchTopSessions,
  listBatchTops,
  cancelStudySession,
  createSessionFromProposal,
  deleteProposedSession,
  listMyBatchTopRequests,
  listProposedSessions,
  setProposedSessionMeetingLink,
  startBatchTopSession,
  voteProposedSession,
} = require("../controllers/studySupportController");
const { auth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/batch-tops", auth, listBatchTops);
router.post("/requests", auth, createBatchTopRequest);
router.get("/requests/my", auth, listMyBatchTopRequests);
router.get("/batch-top/pending-groups", auth, listBatchTopPendingGroups);
router.post("/sessions/start", auth, startBatchTopSession);
router.get("/sessions", auth, listBatchTopSessions);
router.delete("/sessions/:id", auth, cancelStudySession);

router.post("/proposals", auth, createProposedSession);
router.get("/proposals", auth, listProposedSessions);
router.delete("/proposals/:id", auth, deleteProposedSession);
router.post("/proposals/:id/vote", auth, voteProposedSession);
router.post("/proposals/:id/meeting-link", auth, setProposedSessionMeetingLink);
router.post("/proposals/:id/create-session", auth, createSessionFromProposal);

module.exports = router;
