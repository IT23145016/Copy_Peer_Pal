import { useEffect, useState } from "react";
import { ArrowLeft, CircleHelp, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

export default function StudySessionsRequestPage() {
  const [profile, setProfile] = useState(null);
  const [modules, setModules] = useState([]);
  const [batchTops, setBatchTops] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [draft, setDraft] = useState({ moduleId: "", note: "", targetBatchTop: "" });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const auth = getStoredAuth();

  const loadData = async () => {
    try {
      const [meRes, modRes, btRes, myReqRes] = await Promise.all([
        api.get("/auth/me"), api.get("/modules"), api.get("/study-support/batch-tops"), api.get("/study-support/requests/my"),
      ]);
      setProfile(meRes.data); setModules(modRes.data); setBatchTops(btRes.data); setMyRequests(myReqRes.data);
      setDraft((p) => ({ ...p, moduleId: p.moduleId || modRes.data?.[0]?._id || "", targetBatchTop: p.targetBatchTop || btRes.data?.[0]?._id || "" }));
    } catch (err) { setError(err.response?.data?.message || "Failed to load"); }
  };

  useEffect(() => { loadData(); }, []);
  const onLogout = () => { clearStoredAuth(); navigate("/"); };

  const onSubmit = async (e) => {
    e.preventDefault(); setError(""); setStatus("");
    if (!draft.moduleId || !draft.targetBatchTop || !draft.note.trim()) { setError("All fields are required"); return; }
    try {
      await api.post("/study-support/requests", draft);
      setStatus("Request sent to Batch Top!");
      setDraft((p) => ({ ...p, note: "" }));
      await loadData();
    } catch (err) { setError(err.response?.data?.message || "Failed to send"); }
  };

  const STATUS_STYLE = {
    pending:  { bg: "rgba(245,128,37,0.1)", color: "#c85a0a" },
    accepted: { bg: "rgba(22,163,74,0.1)",  color: "#15803d" },
    rejected: { bg: "rgba(239,68,68,0.1)",  color: "#dc2626" },
  };

  return (
    <div className="pp-layout">
      <Sidebar profile={profile || auth?.user} onLogout={onLogout} />
      <main className="pp-main">
        <div className="ss-header">
          <div>
            <button type="button" className="aa-back-btn" onClick={() => navigate("/study-sessions")}><ArrowLeft size={15} /> Back</button>
            <h1 className="hd-title" style={{ marginTop: "0.5rem" }}>Request a Session</h1>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {status ? <p className="success">{status}</p> : null}

        <div className="ss-request-grid">
          <div className="aa-card">
            <div className="aa-card-head">
              <div className="aa-card-icon"><CircleHelp size={18} /></div>
              <div><h3>Send Request</h3><p className="pp-muted">Choose a Batch Top and describe what you need.</p></div>
            </div>

            <div className="hd-bt-list">
              {batchTops.map((bt) => (
                <button key={bt._id} type="button" className={`hd-bt-card ${draft.targetBatchTop === bt._id ? "active" : ""}`} onClick={() => setDraft((p) => ({ ...p, targetBatchTop: bt._id }))}>
                  <div className="hd-bt-avatar">{(bt.name || "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}</div>
                  <div><strong>{bt.name}</strong><span>{bt.moduleSpecialization || "General"} · Y{bt.academicYear} S{bt.semester}</span></div>
                </button>
              ))}
              {batchTops.length === 0 && <p className="pp-muted">No Batch Tops available.</p>}
            </div>

            <form className="aa-form" onSubmit={onSubmit} noValidate style={{ marginTop: "0.8rem" }}>
              <div className="aa-field">
                <label>Module</label>
                <select value={draft.moduleId} onChange={(e) => setDraft((p) => ({ ...p, moduleId: e.target.value }))}>
                  <option value="">Select Module</option>
                  {modules.map((m) => <option key={m._id} value={m._id}>{m.moduleCode} — {m.moduleName}</option>)}
                </select>
              </div>
              <div className="aa-field">
                <label>Note</label>
                <textarea value={draft.note} onChange={(e) => setDraft((p) => ({ ...p, note: e.target.value }))} placeholder="e.g. I need help with Lesson 3 — Integration" rows={3} style={{ border: "1px solid rgba(245,128,37,0.2)", borderRadius: "12px", padding: "0.7rem", background: "#fffaf6", fontFamily: "inherit", fontSize: "0.92rem" }} />
              </div>
              <button type="submit" className="aa-submit-btn">Send Request</button>
            </form>
          </div>

          <div>
            <h3 className="ss-section-title"><UsersRound size={16} /> My Requests</h3>
            <div className="ss-sessions-list">
              {myRequests.length ? myRequests.map((item) => {
                const s = STATUS_STYLE[item.status] || STATUS_STYLE.pending;
                return (
                  <div key={item._id} className="ss-session-card">
                    <div className="ss-session-top">
                      <span className="hd-module-badge">{item.moduleCode}</span>
                      <span className="ss-status-chip" style={{ background: s.bg, color: s.color }}>{item.status}</span>
                    </div>
                    <p className="ss-proposal-desc">{item.note}</p>
                    <p className="pp-muted" style={{ fontSize: "0.78rem" }}>To: {item.targetBatchTop?.name || "—"}</p>
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
