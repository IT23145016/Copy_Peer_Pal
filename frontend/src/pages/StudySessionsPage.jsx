import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, ExternalLink, Funnel, Plus, ThumbsDown, ThumbsUp, Trash2, UsersRound, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

const getModuleKey = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || "";
};

export default function StudySessionsPage() {
  const [profile, setProfile] = useState(null);
  const [modules, setModules] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [meetingLinkDrafts, setMeetingLinkDrafts] = useState({});
  const [filters, setFilters] = useState({ year: "", semester: "", moduleCode: "" });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const auth = getStoredAuth();

  const role = profile?.role || auth?.user?.role || "user";
  const isAdmin = role === "admin";

  const loadData = async () => {
    try {
      const [meRes, modRes, sessRes, propRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/modules"),
        api.get("/study-support/sessions"),
        api.get("/study-support/proposals"),
      ]);
      setProfile(meRes.data);
      setModules(modRes.data);
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

  const onDeleteProposal = async (proposalId) => {
    if (!window.confirm("Delete this proposal?")) return;

    try {
      setError("");
      setStatus("");
      await api.delete(`/study-support/proposals/${proposalId}`);
      setStatus("Proposal deleted");
      setMeetingLinkDrafts((prev) => {
        const next = { ...prev };
        delete next[proposalId];
        return next;
      });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete proposal");
    }
  };

  const moduleMetaMap = useMemo(
    () =>
      new Map(
        modules.map((item) => [
          String(item._id),
          {
            academicYear: item.academicYear,
            semester: item.semester,
          },
        ])
      ),
    [modules]
  );

  const attachModuleMeta = (item) => {
    const moduleMeta = moduleMetaMap.get(String(getModuleKey(item.moduleRef))) || {};
    return {
      ...item,
      academicYear: item.academicYear || moduleMeta.academicYear || "",
      semester: item.semester || moduleMeta.semester || "",
    };
  };

  const matchesFilters = (item) => {
    if (filters.year && String(item.academicYear || "") !== filters.year) return false;
    if (filters.semester && String(item.semester || "") !== filters.semester) return false;
    if (filters.moduleCode && String(item.moduleCode || "") !== filters.moduleCode) return false;
    return true;
  };

  const adminModuleOptions = useMemo(() => {
    const optionMap = new Map();

    [...studySessions.map(attachModuleMeta), ...proposals.map(attachModuleMeta)].forEach((item) => {
      if (!item.moduleCode) return;
      optionMap.set(String(item.moduleCode), {
        moduleCode: item.moduleCode,
        moduleName: item.moduleName || item.moduleCode,
      });
    });

    return Array.from(optionMap.values()).sort((a, b) => a.moduleCode.localeCompare(b.moduleCode));
  }, [studySessions, proposals, moduleMetaMap]);

  const filteredStudySessions = useMemo(
    () => studySessions.map(attachModuleMeta).filter(matchesFilters),
    [studySessions, moduleMetaMap, filters]
  );

  const filteredProposals = useMemo(
    () => proposals.map(attachModuleMeta).filter(matchesFilters),
    [proposals, moduleMetaMap, filters]
  );

  const approvedProposals = useMemo(
    () => filteredProposals.filter((item) => item.status === "approved"),
    [filteredProposals]
  );

  const pendingProposals = useMemo(
    () => filteredProposals.filter((item) => item.status !== "approved"),
    [filteredProposals]
  );

  const subtitle = isAdmin
    ? `${filteredStudySessions.length} scheduled · ${approvedProposals.length} proposed · ${pendingProposals.length} pending`
    : `${studySessions.length} upcoming · ${proposals.length} proposals`;

  return (
    <div className="pp-layout">
      <Sidebar profile={profile || auth?.user} onLogout={onLogout} />
      <main className="pp-main">
        <div className="ss-header">
          <div>
            <h1 className="hd-title">Study Sessions</h1>
            <p className="pp-muted">{subtitle}</p>
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

        {isAdmin ? (
          <div className="aa-filter-row ss-admin-filter-row" style={{ marginBottom: "1rem" }}>
            <div className="ss-admin-filter-label">
              <Funnel size={15} />
              <span>Filter sessions</span>
            </div>
            <select
              name="year"
              value={filters.year}
              onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
            >
              <option value="">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
            <select
              name="semester"
              value={filters.semester}
              onChange={(e) => setFilters((prev) => ({ ...prev, semester: e.target.value }))}
            >
              <option value="">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
            <select
              name="moduleCode"
              value={filters.moduleCode}
              onChange={(e) => setFilters((prev) => ({ ...prev, moduleCode: e.target.value }))}
            >
              <option value="">All Modules</option>
              {adminModuleOptions.map((item) => (
                <option key={item.moduleCode} value={item.moduleCode}>
                  {item.moduleCode} - {item.moduleName}
                </option>
              ))}
            </select>
            <button type="button" className="aa-filter-reset-btn" onClick={() => setFilters({ year: "", semester: "", moduleCode: "" })}>
              Reset
            </button>
          </div>
        ) : null}

        {error ? <p className="error">{error}</p> : null}
        {status ? <p className="success">{status}</p> : null}

        <div className="ss-single-col">
          <h3 className="ss-section-title"><CalendarDays size={16} /> Upcoming Sessions</h3>
          <div className="ss-sessions-list">
            {filteredStudySessions.length ? filteredStudySessions.map((item) => {
              const canCancelSession =
                isAdmin ||
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
            {filteredProposals.length ? filteredProposals.map((item) => {
              const isOwner = String(item.createdBy?._id || item.createdBy) === String(profile?._id);
              const alreadyVoted = !!item.myVote;
              const canVote = !isOwner && !alreadyVoted;
              const isPendingProposal = item.status === "pending";
              const hasLinkedSession = !!item.linkedStudySession;
              const canDeleteProposal =
                !hasLinkedSession && (isAdmin || (isOwner && isPendingProposal));

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
                  {canDeleteProposal ? (
                    <div style={{ marginTop: "0.5rem" }}>
                      <button
                        type="button"
                        className="ss-action-btn ss-btn-outline"
                        style={{ padding: "0.55rem 0.9rem" }}
                        onClick={() => onDeleteProposal(item._id)}
                      >
                        <Trash2 size={13} /> Delete Proposal
                      </button>
                    </div>
                  ) : null}
                  {!canDeleteProposal && hasLinkedSession ? (
                    <p className="pp-muted" style={{ fontSize: "0.74rem", marginTop: "0.5rem" }}>
                      This proposal already has a created session. Cancel the session first.
                    </p>
                  ) : null}
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
