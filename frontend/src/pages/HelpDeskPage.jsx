import { useEffect, useMemo, useState } from "react";
import { CircleHelp, Download, Flag, Plus, Trophy, Upload, UsersRound, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const dataUrlToBlob = (dataUrl) => {
  const [meta, base64] = dataUrl.split(",");
  const mimeMatch = /data:(.*?);base64/.exec(meta || "");
  const mime = mimeMatch?.[1] || "application/octet-stream";
  const binary = atob(base64 || "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

const openDataUrl = (fileData) => {
  const blob = dataUrlToBlob(fileData);
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
};

const downloadDataUrl = (fileData, fileName) => {
  const blob = dataUrlToBlob(fileData);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName || "document";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
};

const STATUS_COLORS = {
  open: { bg: "rgba(245,128,37,0.1)", color: "#c85a0a", label: "Open" },
  in_progress: { bg: "rgba(234,179,8,0.12)", color: "#92400e", label: "In Progress" },
  received: { bg: "rgba(22,163,74,0.1)", color: "#15803d", label: "Received" },
};

export default function HelpDeskPage() {
  const [profile, setProfile] = useState(null);
  const [modules, setModules] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [batchTops, setBatchTops] = useState([]);
  const [myBatchTopRequests, setMyBatchTopRequests] = useState([]);
  const [batchTopPendingGroups, setBatchTopPendingGroups] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [draft, setDraft] = useState({ moduleId: "", message: "", priority: "medium", status: "open" });
  const [batchTopDraft, setBatchTopDraft] = useState({ moduleId: "", note: "", targetBatchTop: "" });
  const [sessionDraft, setSessionDraft] = useState({ moduleId: "", date: "", startTime: "", endTime: "", meetingLink: "" });
  const [proposalDraft, setProposalDraft] = useState({ moduleId: "", description: "", date: "", startTime: "", endTime: "" });
  const [meetingLinkDrafts, setMeetingLinkDrafts] = useState({});
  const [editingId, setEditingId] = useState("");
  const [uploadingId, setUploadingId] = useState("");
  const [uploadFiles, setUploadFiles] = useState({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState("requests");
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const auth = getStoredAuth();

  const canSubmit = useMemo(() => draft.moduleId && draft.message.trim(), [draft.message, draft.moduleId]);
  const canSubmitBatchTopRequest = useMemo(() => batchTopDraft.moduleId && batchTopDraft.note.trim() && batchTopDraft.targetBatchTop, [batchTopDraft]);

  const loadData = async () => {
    try {
      const [meRes, modRes, reqRes, lbRes, btRes, myBtRes, propRes, sessRes] = await Promise.all([
        api.get("/auth/me"), api.get("/modules"), api.get("/helpdesk"),
        api.get("/helpdesk/leaderboard"), api.get("/study-support/batch-tops"),
        api.get("/study-support/requests/my"), api.get("/study-support/proposals"),
        api.get("/study-support/sessions"),
      ]);
      setProfile(meRes.data); setModules(modRes.data); setRequests(reqRes.data);
      setLeaderboard(lbRes.data); setBatchTops(btRes.data); setMyBatchTopRequests(myBtRes.data);
      setProposals(propRes.data); setStudySessions(sessRes.data);
      setDraft((p) => ({ ...p, moduleId: p.moduleId || modRes.data?.[0]?._id || "" }));
      setBatchTopDraft((p) => ({ ...p, moduleId: p.moduleId || modRes.data?.[0]?._id || "", targetBatchTop: p.targetBatchTop || btRes.data?.[0]?._id || "" }));
      setProposalDraft((p) => ({ ...p, moduleId: p.moduleId || modRes.data?.[0]?._id || "" }));
      if (meRes.data?.isBatchTop) {
        const grpRes = await api.get("/study-support/batch-top/pending-groups");
        setBatchTopPendingGroups(grpRes.data);
      } else setBatchTopPendingGroups([]);
    } catch (err) { setError(err.response?.data?.message || "Failed to load help desk"); }
  };

  useEffect(() => { loadData(); }, []);

  const onLogout = () => { clearStoredAuth(); navigate("/"); };
  const onDraftChange = (e) => setDraft((p) => ({ ...p, [e.target.name]: e.target.value }));

  const clearDraft = () => {
    setEditingId(""); setShowForm(false);
    setDraft({ moduleId: modules[0]?._id || "", message: "", priority: "medium", status: "open" });
  };

  const onSubmit = async (e) => {
    e.preventDefault(); setError(""); setStatus("");
    if (!canSubmit) { setError("Module and message are required"); return; }
    try {
      setSaving(true);
      if (editingId) { await api.put(`/helpdesk/${editingId}`, draft); setStatus("Request updated"); }
      else { await api.post("/helpdesk", draft); setStatus("Request posted"); }
      clearDraft(); await loadData();
    } catch (err) { setError(err.response?.data?.message || "Failed to save request"); }
    finally { setSaving(false); }
  };

  const onSendBatchTopRequest = async (e) => {
    e.preventDefault(); setError(""); setStatus("");
    if (!canSubmitBatchTopRequest) { setError("Module, note and Batch Top are required"); return; }
    try {
      await api.post("/study-support/requests", batchTopDraft);
      setStatus("Request sent to Batch Top");
      setBatchTopDraft((p) => ({ ...p, note: "" }));
      await loadData();
    } catch (err) { setError(err.response?.data?.message || "Failed to send request"); }
  };

  const onStartSession = async (e) => {
    e.preventDefault(); setError(""); setStatus("");
    try {
      await api.post("/study-support/sessions/start", sessionDraft);
      setStatus("Study session started");
      setSessionDraft({ moduleId: "", date: "", startTime: "", endTime: "", meetingLink: "" });
      await loadData();
    } catch (err) { setError(err.response?.data?.message || "Failed to start session"); }
  };

  const onCreateProposal = async (e) => {
    e.preventDefault(); setError(""); setStatus("");
    try {
      await api.post("/study-support/proposals", proposalDraft);
      setStatus("Proposal created");
      setProposalDraft({ moduleId: modules[0]?._id || "", description: "", date: "", startTime: "", endTime: "" });
      await loadData();
    } catch (err) { setError(err.response?.data?.message || "Failed to create proposal"); }
  };

  const onVoteProposal = async (proposalId, voteType) => {
    try {
      setError(""); setStatus("");
      const { data } = await api.post(`/study-support/proposals/${proposalId}/vote`, { voteType });
      setStatus(data?.approvalNotice?.approved ? `Approved! ${data.approvalNotice.emailSentCount || 0} users notified.` : "Vote saved");
      await loadData();
    } catch (err) { setError(err.response?.data?.message || "Failed to vote"); }
  };

  const onSetMeetingLink = async (proposalId) => {
    try {
      const meetingLink = meetingLinkDrafts[proposalId] || "";
      if (!meetingLink.trim()) { setError("Meeting link is required"); return; }
      await api.post(`/study-support/proposals/${proposalId}/meeting-link`, { meetingLink });
      setStatus("Meeting link added"); await loadData();
    } catch (err) { setError(err.response?.data?.message || "Failed to set meeting link"); }
  };

  const onEdit = (item) => {
    setShowForm(true); setEditingId(item._id);
    setDraft({ moduleId: item.moduleRef?._id || item.moduleRef || "", message: item.message || "", priority: item.priority || "medium", status: item.status || "open" });
  };

  const onDelete = async (id) => {
    try {
      setError(""); setStatus("");
      await api.delete(`/helpdesk/${id}`);
      if (editingId === id) clearDraft();
      setStatus("Request deleted"); await loadData();
    } catch (err) { setError(err.response?.data?.message || "Failed to delete"); }
  };

  const onUploadDoc = async (id) => {
    const file = uploadFiles[id];
    try {
      if (!file) { setError("Choose a document first"); return; }
      if (file.size > 1024 * 1024 * 2) { setError("Document must be less than 2MB"); return; }
      setError(""); setStatus("");
      const fileData = await toDataUrl(file);
      setUploadingId(id);
      await api.post(`/helpdesk/${id}/documents`, { fileName: file.name, fileType: file.type, fileData });
      setUploadFiles((prev) => { const next = { ...prev }; delete next[id]; return next; });
      setStatus("Document uploaded."); await loadData();
    } catch (err) { setError(err.response?.data?.message || "Failed to upload"); }
    finally { setUploadingId(""); }
  };

  const onApproveDoc = async (requestId, documentId) => {
    try {
      setError(""); setStatus("");
      await api.post(`/helpdesk/${requestId}/documents/${documentId}/approve`);
      setStatus("Document approved."); await loadData();
    } catch (err) { setError(err.response?.data?.message || "Failed to approve"); }
  };

  const tabs = [
    { key: "requests", label: "Requests", icon: <CircleHelp size={15} /> },
    { key: "batchtop", label: "Batch Top", icon: <UsersRound size={15} /> },
    { key: "leaderboard", label: "Leaderboard", icon: <Trophy size={15} /> },
  ];

  return (
    <div className="pp-layout">
      <Sidebar profile={profile || auth?.user} onLogout={onLogout} />
      <main className="pp-main">

        {/* Header */}
        <div className="hd-header">
          <div>
            <h1 className="hd-title">Help Desk</h1>
            <p className="pp-muted">Ask for help, share resources, and support your peers.</p>
          </div>
          <button type="button" className="hd-new-btn" onClick={() => { setShowForm(true); setEditingId(""); setDraft({ moduleId: modules[0]?._id || "", message: "", priority: "medium", status: "open" }); }}>
            <Plus size={16} /> New Request
          </button>
        </div>

        {/* Tabs */}
        <div className="hd-tabs">
          {tabs.map((t) => (
            <button key={t.key} type="button" className={`hd-tab ${activeView === t.key ? "active" : ""}`} onClick={() => setActiveView(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {error ? <p className="error">{error}</p> : null}
        {status ? <p className="success">{status}</p> : null}

        {/* New/Edit Request Modal */}
        {showForm ? (
          <div className="hd-modal-overlay">
            <div className="hd-modal">
              <div className="hd-modal-head">
                <h3>{editingId ? "Edit Request" : "New Help Request"}</h3>
                <button type="button" className="hd-modal-close" onClick={clearDraft}><X size={18} /></button>
              </div>
              <form onSubmit={onSubmit} noValidate className="hd-modal-form">
                <div className="aa-field">
                  <label>Module</label>
                  <select name="moduleId" value={draft.moduleId} onChange={onDraftChange}>
                    <option value="">Select Module</option>
                    {modules.map((m) => <option key={m._id} value={m._id}>{m.moduleCode} — {m.moduleName}</option>)}
                  </select>
                </div>
                <div className="aa-field">
                  <label>Message</label>
                  <textarea name="message" value={draft.message} onChange={onDraftChange} placeholder="e.g. I need past papers for ITPM module" rows={4} />
                </div>
                <div className="aa-field">
                  <label>Priority</label>
                  <div className="hd-priority-row">
                    {["medium", "urgent"].map((p) => (
                      <button key={p} type="button" className={`hd-priority-btn ${draft.priority === p ? "active-" + p : ""}`} onClick={() => setDraft((prev) => ({ ...prev, priority: p }))}>
                        <Flag size={13} /> {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="hd-modal-actions">
                  <button type="button" className="hd-cancel-btn" onClick={clearDraft}>Cancel</button>
                  <button type="submit" className="hd-submit-btn" disabled={!canSubmit || saving}>
                    {saving ? "Saving..." : editingId ? "Update" : "Post Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* Requests tab */}
        {activeView === "requests" ? (
          <div className="hd-requests-grid">
            {requests.length ? requests.map((item) => {
              const s = STATUS_COLORS[item.status] || STATUS_COLORS.open;
              const canEdit = item.isOwner && !item.hasDocuments;
              return (
                <article key={item._id} className="hd-card">
                  <div className="hd-card-top">
                    <div className="hd-card-meta">
                      <span className="hd-module-badge">{item.moduleCode}</span>
                      <span className="hd-card-by">by {item.createdBy?.name || "Unknown"}</span>
                    </div>
                    <div className="hd-card-badges">
                      <span className="hd-priority-chip" style={{ background: item.priority === "urgent" ? "rgba(239,68,68,0.1)" : "rgba(245,128,37,0.1)", color: item.priority === "urgent" ? "#dc2626" : "#c85a0a" }}>
                        <Flag size={11} /> {item.priority}
                      </span>
                      <span className="hd-status-chip" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                  </div>

                  <p className="hd-card-msg">{item.message}</p>

                  <div className="hd-card-actions">
                    {canEdit ? <button type="button" className="hd-action-edit" onClick={() => onEdit(item)}>Edit</button> : null}
                    {item.isOwner || profile?.role === "admin" ? <button type="button" className="hd-action-delete" onClick={() => onDelete(item._id)}>Delete</button> : null}
                  </div>

                  <div className="hd-upload-row">
                    <label className="hd-file-label">
                      <Upload size={13} /> {uploadFiles[item._id] ? uploadFiles[item._id].name : "Choose file"}
                      <input type="file" style={{ display: "none" }} onChange={(e) => setUploadFiles((prev) => ({ ...prev, [item._id]: e.target.files?.[0] || undefined }))} />
                    </label>
                    <button type="button" className="hd-upload-btn" onClick={() => onUploadDoc(item._id)}>
                      {uploadingId === item._id ? "Uploading..." : "Upload"}
                    </button>
                  </div>

                  {item.documents?.length ? (
                    <div className="hd-doc-list">
                      {item.documents.map((doc) => (
                        <div key={doc._id} className="hd-doc-row">
                          <span className="hd-doc-name">{doc.fileName}</span>
                          <div className="hd-doc-actions">
                            <button type="button" className="hd-doc-btn" onClick={() => openDataUrl(doc.fileData)}>Open</button>
                            <button type="button" className="hd-doc-btn" onClick={() => downloadDataUrl(doc.fileData, doc.fileName)}><Download size={12} /></button>
                            {doc.approved ? (
                              <span className="hd-approved-chip">✓ Approved</span>
                            ) : item.isOwner && String(doc.uploadedBy?._id || doc.uploadedBy) !== String(profile?._id) ? (
                              <button type="button" className="hd-doc-btn hd-approve-btn" onClick={() => onApproveDoc(item._id, doc._id)}>Approve</button>
                            ) : (
                              <span className="hd-pending-chip">Pending</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            }) : (
              <div className="hd-empty">
                <CircleHelp size={40} />
                <p>No requests yet. Be the first to ask for help!</p>
              </div>
            )}
          </div>
        ) : null}

        {/* Batch Top tab */}
        {activeView === "batchtop" ? (
          <div className="hd-batchtop-grid">
            <div className="aa-card">
              <div className="aa-card-head">
                <div className="aa-card-icon"><UsersRound size={18} /></div>
                <div><h3>Request from Batch Top</h3><p className="pp-muted">Select a Batch Top and describe what you need.</p></div>
              </div>
              <div className="hd-bt-list">
                {batchTops.map((bt) => (
                  <button key={bt._id} type="button" className={`hd-bt-card ${batchTopDraft.targetBatchTop === bt._id ? "active" : ""}`} onClick={() => setBatchTopDraft((p) => ({ ...p, targetBatchTop: bt._id }))}>
                    <div className="hd-bt-avatar">{(bt.name || "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}</div>
                    <div><strong>{bt.name}</strong><span>{bt.moduleSpecialization || "General"}</span></div>
                  </button>
                ))}
              </div>
              <form className="aa-form" onSubmit={onSendBatchTopRequest} noValidate>
                <div className="aa-field">
                  <label>Module</label>
                  <select value={batchTopDraft.moduleId} onChange={(e) => setBatchTopDraft((p) => ({ ...p, moduleId: e.target.value }))}>
                    <option value="">Select Module</option>
                    {modules.map((m) => <option key={m._id} value={m._id}>{m.moduleCode} — {m.moduleName}</option>)}
                  </select>
                </div>
                <div className="aa-field">
                  <label>Note</label>
                  <textarea value={batchTopDraft.note} onChange={(e) => setBatchTopDraft((p) => ({ ...p, note: e.target.value }))} placeholder="I need help with Lesson 3..." rows={3} />
                </div>
                <button type="submit" className="aa-submit-btn">Send Request</button>
              </form>
            </div>

            <div className="aa-card">
              <div className="aa-card-head">
                <div className="aa-card-icon"><CircleHelp size={18} /></div>
                <div><h3>My Batch Top Requests</h3></div>
              </div>
              <div className="hd-bt-requests">
                {myBatchTopRequests.length ? myBatchTopRequests.map((item) => (
                  <div key={item._id} className="hd-bt-req-row">
                    <span className="hd-module-badge">{item.moduleCode}</span>
                    <p className="hd-card-msg">{item.note}</p>
                    <p className="pp-muted">To: {item.targetBatchTop?.name || "—"} · {item.status}</p>
                  </div>
                )) : <p className="pp-muted">No requests sent yet.</p>}
              </div>

              {profile?.isBatchTop ? (
                <>
                  <div className="aa-card-head" style={{ marginTop: "1rem" }}>
                    <div className="aa-card-icon"><UsersRound size={18} /></div>
                    <div><h3>Pending Groups</h3></div>
                  </div>
                  {batchTopPendingGroups.map((group) => (
                    <div key={group.moduleId} className="hd-bt-req-row">
                      <strong>{group.moduleCode} — {group.moduleName}</strong>
                      <p className="pp-muted">{group.requestCount} requests · {group.participantCount} participants</p>
                      <button type="button" className="aa-submit-btn" style={{ marginTop: "0.5rem" }} disabled={!group.canStartSession} onClick={() => setSessionDraft((p) => ({ ...p, moduleId: group.moduleId }))}>
                        {group.canStartSession ? "Start Session" : "Need 1+ request"}
                      </button>
                    </div>
                  ))}
                  {sessionDraft.moduleId ? (
                    <form className="aa-form" onSubmit={onStartSession} noValidate style={{ marginTop: "1rem" }}>
                      <div className="aa-form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                        <div className="aa-field"><label>Date</label><input type="date" value={sessionDraft.date} onChange={(e) => setSessionDraft((p) => ({ ...p, date: e.target.value }))} /></div>
                        <div className="aa-field"><label>Start</label><input type="time" value={sessionDraft.startTime} onChange={(e) => setSessionDraft((p) => ({ ...p, startTime: e.target.value }))} /></div>
                        <div className="aa-field"><label>End</label><input type="time" value={sessionDraft.endTime} onChange={(e) => setSessionDraft((p) => ({ ...p, endTime: e.target.value }))} /></div>
                      </div>
                      <div className="aa-field"><label>Meeting Link</label><input placeholder="Teams link" value={sessionDraft.meetingLink} onChange={(e) => setSessionDraft((p) => ({ ...p, meetingLink: e.target.value }))} /></div>
                      <button type="submit" className="aa-submit-btn">Create Session</button>
                    </form>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Leaderboard tab */}
        {activeView === "leaderboard" ? (
          <div className="hd-leaderboard">
            <div className="aa-card">
              <div className="aa-card-head">
                <div className="aa-card-icon"><Trophy size={18} /></div>
                <div><h3>Most Trusted Users</h3><p className="pp-muted">Minimum 5 approved documents required.</p></div>
              </div>
              <div className="hd-lb-list">
                {leaderboard.length ? leaderboard.map((item, i) => (
                  <div key={item.userId} className="hd-lb-row">
                    <span className={`hd-lb-rank ${i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""}`}>#{i + 1}</span>
                    <div className="hd-lb-avatar">{(item.name || "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}</div>
                    <div className="hd-lb-info">
                      <strong>{item.name}</strong>
                      <p className="pp-muted">{item.approvedDocsCount} approved docs · helped {item.helpedRequestsCount} requests</p>
                    </div>
                    <span className="hd-lb-points">{item.points} pts</span>
                  </div>
                )) : <p className="pp-muted">No trusted users yet.</p>}
              </div>
            </div>
          </div>
        ) : null}

      </main>
    </div>
  );
}
