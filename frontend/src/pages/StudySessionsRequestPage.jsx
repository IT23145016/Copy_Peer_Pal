import { useEffect, useState } from "react";
import { ArrowLeft, CircleHelp, Pencil, Trash2, UsersRound, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

const formatRequestDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export default function StudySessionsRequestPage() {
  const [profile, setProfile] = useState(null);
  const [modules, setModules] = useState([]);
  const [batchTops, setBatchTops] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [draft, setDraft] = useState({ moduleId: "", note: "", targetBatchTop: "" });
  const [editingId, setEditingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const auth = getStoredAuth();

  const loadData = async () => {
    try {
      const [meRes, modRes, btRes, myReqRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/modules"),
        api.get("/study-support/batch-tops"),
        api.get("/study-support/requests/my"),
      ]);
      setProfile(meRes.data);
      setModules(modRes.data);
      setBatchTops(btRes.data);
      setMyRequests(myReqRes.data);
      setDraft((prev) => ({
        ...prev,
        moduleId: prev.moduleId || modRes.data?.[0]?._id || "",
        targetBatchTop: prev.targetBatchTop || btRes.data?.[0]?._id || "",
      }));
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

  const resetDraft = () => {
    setEditingId("");
    setDraft({
      moduleId: modules[0]?._id || "",
      note: "",
      targetBatchTop: batchTops[0]?._id || "",
    });
  };

  const selectedBatchTop = batchTops.find((item) => item._id === draft.targetBatchTop) || null;
  const selectedModule = modules.find((item) => item._id === draft.moduleId) || null;
  const canSubmit = !!draft.moduleId && !!draft.targetBatchTop && !!draft.note.trim() && !submitting;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!draft.moduleId || !draft.targetBatchTop || !draft.note.trim()) {
      setError("All fields are required");
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await api.put(`/study-support/requests/${editingId}`, draft);
        setStatus("Request updated");
      } else {
        await api.post("/study-support/requests", draft);
        setStatus("Request sent to Batch Top!");
      }
      resetDraft();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || (editingId ? "Failed to update" : "Failed to send"));
    } finally {
      setSubmitting(false);
    }
  };

  const onEditRequest = (item) => {
    setError("");
    setStatus("");
    setEditingId(item._id);
    setDraft({
      moduleId: item.moduleRef?._id || item.moduleRef || "",
      note: item.note || "",
      targetBatchTop: item.targetBatchTop?._id || item.targetBatchTop || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDeleteRequest = async (id) => {
    if (!window.confirm("Delete this request?")) return;

    try {
      setError("");
      setStatus("");
      await api.delete(`/study-support/requests/${id}`);
      if (editingId === id) resetDraft();
      setStatus("Request deleted");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete");
    }
  };

  const STATUS_STYLE = {
    pending: { bg: "rgba(245,128,37,0.1)", color: "#c85a0a" },
    accepted: { bg: "rgba(22,163,74,0.1)", color: "#15803d" },
    rejected: { bg: "rgba(239,68,68,0.1)", color: "#dc2626" },
  };

  return (
    <div className="pp-layout">
      <Sidebar profile={profile || auth?.user} onLogout={onLogout} />
      <main className="pp-main">
        <div className="ss-header">
          <div>
            <button type="button" className="aa-back-btn" onClick={() => navigate("/study-sessions")}><ArrowLeft size={15} /> Back</button>
            <h1 className="hd-title" style={{ marginTop: "0.5rem" }}>Request a Session</h1>
            <p className="pp-muted" style={{ marginTop: "0.45rem" }}>Choose a Batch Top, select the module, and explain exactly what help you need.</p>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {status ? <p className="success">{status}</p> : null}

        <div className="ss-request-grid">
          <div className="aa-card">
            <div className="aa-card-head">
              <div className="aa-card-icon"><CircleHelp size={18} /></div>
              <div>
                <h3>{editingId ? "Edit Request" : "Send Request"}</h3>
                <p className="pp-muted">Good requests mention the exact lesson, assignment, or topic you need help with.</p>
              </div>
            </div>

            <div style={{ marginTop: "0.85rem", marginBottom: "0.9rem", padding: "0.8rem 0.95rem", borderRadius: "14px", border: "1px solid rgba(245,128,37,0.12)", background: "#fffaf6" }}>
              <strong style={{ display: "block", fontSize: "0.88rem", color: "#1f1720" }}>Request Tips</strong>
              <p className="pp-muted" style={{ fontSize: "0.8rem", marginTop: "0.35rem" }}>
                Example: "Need help with Week 4 recursion problems before Friday's quiz."
              </p>
            </div>

            <div className="hd-bt-list">
              {batchTops.map((bt) => (
                <button
                  key={bt._id}
                  type="button"
                  className={`hd-bt-card ${draft.targetBatchTop === bt._id ? "active" : ""}`}
                  onClick={() => setDraft((prev) => ({ ...prev, targetBatchTop: bt._id }))}
                >
                  <div className="hd-bt-avatar">{(bt.name || "U").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{bt.name}</strong>
                    <span>{bt.moduleSpecialization || "General"} · Y{bt.academicYear} S{bt.semester}</span>
                  </div>
                </button>
              ))}
              {batchTops.length === 0 && <p className="pp-muted">No Batch Tops available.</p>}
            </div>

            {selectedBatchTop ? (
              <div style={{ marginTop: "0.8rem", padding: "0.8rem 0.95rem", borderRadius: "14px", border: "1px solid rgba(245,128,37,0.12)", background: "#fff" }}>
                <strong style={{ display: "block", fontSize: "0.88rem", color: "#1f1720" }}>Selected Batch Top</strong>
                <p style={{ marginTop: "0.3rem", marginBottom: 0, fontWeight: 700, color: "#1f1720" }}>{selectedBatchTop.name}</p>
                <p className="pp-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                  {selectedBatchTop.moduleSpecialization || "General support"} · Year {selectedBatchTop.academicYear} Semester {selectedBatchTop.semester}
                </p>
              </div>
            ) : null}

            <form className="aa-form" onSubmit={onSubmit} noValidate style={{ marginTop: "0.9rem" }}>
              <div className="aa-field">
                <label>Module</label>
                <select value={draft.moduleId} onChange={(e) => setDraft((prev) => ({ ...prev, moduleId: e.target.value }))}>
                  <option value="">Select Module</option>
                  {modules.map((item) => <option key={item._id} value={item._id}>{item.moduleCode} - {item.moduleName}</option>)}
                </select>
                {selectedModule ? (
                  <p className="pp-muted" style={{ fontSize: "0.78rem", marginTop: "0.35rem" }}>
                    Selected: {selectedModule.moduleCode} - {selectedModule.moduleName}
                  </p>
                ) : null}
              </div>

              <div className="aa-field">
                <label>Request Details</label>
                <textarea
                  value={draft.note}
                  onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="e.g. I need help with Lesson 3 - Integration"
                  rows={4}
                  style={{ border: "1px solid rgba(245,128,37,0.2)", borderRadius: "12px", padding: "0.7rem", background: "#fffaf6", fontFamily: "inherit", fontSize: "0.92rem", resize: "vertical" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginTop: "0.35rem" }}>
                  <span className="pp-muted" style={{ fontSize: "0.78rem" }}>Add enough detail so the Batch Top knows what to prepare.</span>
                  <span className="pp-muted" style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>{draft.note.trim().length} chars</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                <button type="submit" className="aa-submit-btn" disabled={!canSubmit || batchTops.length === 0 || modules.length === 0}>
                  {submitting ? (editingId ? "Updating..." : "Sending...") : (editingId ? "Update Request" : "Send Request")}
                </button>
                {editingId ? (
                  <button type="button" className="ss-session-cancel-btn" onClick={resetDraft}>
                    <X size={13} /> Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div>
            <h3 className="ss-section-title"><UsersRound size={16} /> My Requests</h3>
            <div className="ss-sessions-list">
              {myRequests.length ? myRequests.map((item) => {
                const style = STATUS_STYLE[item.status] || STATUS_STYLE.pending;
                const canManage = item.status === "pending";

                return (
                  <div key={item._id} className="ss-session-card">
                    <div className="ss-session-top">
                      <span className="hd-module-badge">{item.moduleCode}</span>
                      <span className="ss-status-chip" style={{ background: style.bg, color: style.color }}>{item.status}</span>
                    </div>
                    <p className="ss-proposal-desc">{item.note}</p>
                    <p className="pp-muted" style={{ fontSize: "0.78rem" }}>To: {item.targetBatchTop?.name || "-"}</p>
                    <p className="pp-muted" style={{ fontSize: "0.74rem" }}>Requested: {formatRequestDate(item.createdAt) || "Recently"}</p>
                    {canManage ? (
                      <div style={{ display: "flex", gap: "0.55rem", marginTop: "0.7rem", flexWrap: "wrap" }}>
                        <button type="button" className="ss-action-btn ss-btn-outline" style={{ padding: "0.52rem 0.85rem" }} onClick={() => onEditRequest(item)}>
                          <Pencil size={13} /> Edit
                        </button>
                        <button type="button" className="ss-session-cancel-btn" onClick={() => onDeleteRequest(item._id)}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    ) : (
                      <p className="pp-muted" style={{ fontSize: "0.74rem", marginTop: "0.6rem" }}>
                        Only pending requests can be edited or deleted.
                      </p>
                    )}
                  </div>
                );
              }) : <div className="ss-empty"><CircleHelp size={28} /><p>No requests sent yet.</p></div>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
