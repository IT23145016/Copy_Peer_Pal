import { useEffect, useState } from "react";
import { CalendarDays, Clock3, ExternalLink, Plus, ThumbsDown, ThumbsUp, UsersRound, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

export default function StudySessionsPage() {
  const [profile, setProfile] = useState(null);
  const [studySessions, setStudySessions] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [meetingLinkDrafts, setMeetingLinkDrafts] = useState({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const auth = getStoredAuth();

  const loadData = async () => {
    try {
      const [meRes, sessRes, propRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/study-support/sessions"),
        api.get("/study-support/proposals"),
      ]);
      setProfile(meRes.data);
      setStudySessions(sessRes.data);
      setProposals(propRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onLogout = () => {
    clearStoredAuth();
    navigate("/");
  };

  const onVote = async (proposalId, voteType) => {
    try {
      setError("");
      setStatus("");
      const { data } = await api.post(`/study-support/proposals/${proposalId}/vote`, { voteType });
      setStatus(data?.approvalNotice?.approved ? `Approved! ${data.approvalNotice.emailSentCount || 0} users notified.` : "Vote saved");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to vote");
    }
  };

  const onCreateSession = async (proposal) => {
    const link = meetingLinkDrafts[proposal._id] || "";
    if (!link.trim()) {
      setError("Meeting link is required");
      return;
    }

    try {
      setError("");
      setStatus("");
      await api.post(`/study-support/proposals/${proposal._id}/create-session`, {
        date: proposal.date,
        startTime: proposal.startTime,
        endTime: proposal.endTime,
        meetingLink: link,
      });
      setStatus("Session created!");
      setMeetingLinkDrafts((prev) => {
        const next = { ...prev };
        delete next[proposal._id];
        return next;
      });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create session");
    }
  };

  const onCancelSession = async (sessionId) => {
    if (!window.confirm("Cancel this study session?")) return;

    try {
      setError("");
      setStatus("");
      await api.delete(`/study-support/sessions/${sessionId}`);
      setStatus("Study session cancelled");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel session");
    }
  };

  return (
    <div className="pp-layout">
      <Sidebar profile={profile || auth?.user} onLogout={onLogout} />
      <main className="pp-main">
        <div className="ss-header">
          <div>
            <h1 className="hd-title">Study Sessions</h1>
            <p className="pp-muted">{studySessions.length} upcoming · {proposals.length} proposals</p>
          </div>
          <div className="ss-header-actions">
            <Link to="/study-sessions/propose" className="ss-action-btn ss-btn-outline">
              <Plus size={15} /> Propose
            </Link>
            <Link to="/study-sessions/request" className="ss-action-btn ss-btn-primary">
              <UsersRound size={15} /> Request Session
            </Link>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {status ? <p className="success">{status}</p> : null}

        <div className="ss-single-col">
          <h3 className="ss-section-title"><CalendarDays size={16} /> Upcoming Sessions</h3>
          <div className="ss-sessions-list">
            {studySessions.length ? studySessions.map((item) => {
              const canCancelSession =
                profile?.role === "admin" ||
                String(item.initiatedBy?._id || item.initiatedBy) === String(profile?._id);

              return (
                <div key={item._id} className="ss-session-card">
                  <div className="ss-session-top">
                    <span className="hd-module-badge">{item.moduleCode}</span>
                    <span className="ss-time-chip"><Clock3 size={12} /> {item.startTime}-{item.endTime}</span>
                  </div>
                  <h4 className="ss-session-name">{item.moduleName}</h4>
                  <p className="pp-muted ss-date">Date: {item.date}</p>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    {item.meetingLink ? (
                      <a href={item.meetingLink} target="_blank" rel="noreferrer" className="ss-join-btn">
                        <ExternalLink size={13} /> Join Meeting
                      </a>
                    ) : (
                      <p className="pp-muted" style={{ fontSize: "0.78rem", margin: 0 }}>Link pending</p>
                    )}
                    {canCancelSession ? (
                      <button
                        type="button"
                        className="ss-action-btn ss-btn-outline"
                        style={{ padding: "0.6rem 0.9rem" }}
                        onClick={() => onCancelSession(item._id)}
                      >
                        <X size={13} /> Cancel Session
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            }) : (
              <div className="ss-empty"><CalendarDays size={32} /><p>No upcoming sessions yet.</p></div>
            )}
          </div>

          <h3 className="ss-section-title" style={{ marginTop: "1rem" }}><Plus size={16} /> Proposals</h3>
          <div className="ss-sessions-list">
            {proposals.length ? proposals.map((item) => {
              const isOwner = String(item.createdBy?._id || item.createdBy) === String(profile?._id);
              const alreadyVoted = !!item.myVote;
              const canVote = !isOwner && !alreadyVoted;

              return (
                <div key={item._id} className={`ss-proposal-card ${item.status === "approved" ? "ss-proposal-approved" : ""}`}>
                  <div className="ss-session-top">
                    <span className="hd-module-badge">{item.moduleCode}</span>
                    <span className={`ss-status-chip ${item.status === "approved" ? "ss-chip-green" : "ss-chip-soft"}`}>{item.status}</span>
                  </div>
                  <p className="ss-proposal-desc">{item.description}</p>
                  <p className="pp-muted" style={{ fontSize: "0.78rem" }}>Date: {item.date} · {item.startTime}-{item.endTime}</p>
                  <div className="ss-vote-row">
                    <button
                      type="button"
                      className={`ss-vote-btn${item.myVote === "like" ? " ss-vote-active" : ""}`}
                      disabled={!canVote}
                      title={isOwner ? "You cannot vote on your own proposal" : alreadyVoted ? "Already voted" : "Like"}
                      onClick={() => onVote(item._id, "like")}
                    >
                      <ThumbsUp size={13} /> {item.likes}
                    </button>
                    <button
                      type="button"
                      className={`ss-vote-btn ss-vote-dislike${item.myVote === "dislike" ? " ss-vote-active-dis" : ""}`}
                      disabled={!canVote}
                      title={isOwner ? "You cannot vote on your own proposal" : alreadyVoted ? "Already voted" : "Dislike"}
                      onClick={() => onVote(item._id, "dislike")}
                    >
                      <ThumbsDown size={13} /> {item.dislikes}
                    </button>
                    {isOwner && <span className="pp-muted" style={{ fontSize: "0.74rem" }}>Your proposal</span>}
                    {!isOwner && alreadyVoted && <span className="pp-muted" style={{ fontSize: "0.74rem" }}>Voted ✓</span>}
                  </div>
                  {item.canCreateSession && isOwner ? (
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                      <input
                        placeholder="Meeting link (Teams/Zoom)"
                        value={meetingLinkDrafts[item._id] || ""}
                        onChange={(e) => setMeetingLinkDrafts((prev) => ({ ...prev, [item._id]: e.target.value }))}
                        style={{ flex: 1, fontSize: "0.85rem", padding: "0.5rem 0.7rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}
                      />
                      <button type="button" className="ss-join-btn" onClick={() => onCreateSession(item)}>Create Session</button>
                    </div>
                  ) : null}
                </div>
              );
            }) : (
              <div className="ss-empty"><Plus size={32} /><p>No proposals yet.</p></div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
