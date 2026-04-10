import { useEffect, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

export default function StudySessionsProposePage() {
  const [profile, setProfile] = useState(null);
  const [modules, setModules] = useState([]);
  const [draft, setDraft] = useState({ moduleId: "", description: "", date: "", startTime: "", endTime: "" });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const auth = getStoredAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, modRes] = await Promise.all([api.get("/auth/me"), api.get("/modules")]);
        setProfile(meRes.data); setModules(modRes.data);
        setDraft((p) => ({ ...p, moduleId: p.moduleId || modRes.data?.[0]?._id || "" }));
      } catch (err) { setError(err.response?.data?.message || "Failed to load"); }
    };
    load();
  }, []);

  const onLogout = () => { clearStoredAuth(); navigate("/"); };

  const onSubmit = async (e) => {
    e.preventDefault(); setError(""); setStatus("");
    try {
      await api.post("/study-support/proposals", draft);
      setStatus("Proposal created successfully!");
      setDraft({ moduleId: modules[0]?._id || "", description: "", date: "", startTime: "", endTime: "" });
    } catch (err) { setError(err.response?.data?.message || "Failed to create"); }
  };

  return (
    <div className="pp-layout">
      <Sidebar profile={profile || auth?.user} onLogout={onLogout} />
      <main className="pp-main">
        <div className="ss-header">
          <div>
            <button type="button" className="aa-back-btn" onClick={() => navigate("/study-sessions")}><ArrowLeft size={15} /> Back</button>
            <h1 className="hd-title" style={{ marginTop: "0.5rem" }}>Propose a Session</h1>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {status ? <p className="success">{status}</p> : null}

        <div style={{ maxWidth: "520px" }}>
          <div className="aa-card">
            <div className="aa-card-head">
              <div className="aa-card-icon"><Plus size={18} /></div>
              <div><h3>New Proposal</h3><p className="pp-muted">Suggest a study session for your peers.</p></div>
            </div>
            <form className="aa-form" onSubmit={onSubmit} noValidate>
              <div className="aa-field">
                <label>Module</label>
                <select value={draft.moduleId} onChange={(e) => setDraft((p) => ({ ...p, moduleId: e.target.value }))}>
                  <option value="">Select Module</option>
                  {modules.map((m) => <option key={m._id} value={m._id}>{m.moduleCode} — {m.moduleName}</option>)}
                </select>
              </div>
              <div className="aa-field">
                <label>Description</label>
                <textarea value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} placeholder="What will this session cover?" rows={3} style={{ border: "1px solid rgba(245,128,37,0.2)", borderRadius: "12px", padding: "0.7rem", background: "#fffaf6", fontFamily: "inherit", fontSize: "0.92rem", resize: "vertical" }} />
              </div>
              <div className="aa-form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                <div className="aa-field"><label>Date</label><input type="date" value={draft.date} onChange={(e) => setDraft((p) => ({ ...p, date: e.target.value }))} /></div>
                <div className="aa-field"><label>Start</label><input type="time" value={draft.startTime} onChange={(e) => setDraft((p) => ({ ...p, startTime: e.target.value }))} /></div>
                <div className="aa-field"><label>End</label><input type="time" value={draft.endTime} onChange={(e) => setDraft((p) => ({ ...p, endTime: e.target.value }))} /></div>
              </div>
              <button type="submit" className="aa-submit-btn">Create Proposal</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
