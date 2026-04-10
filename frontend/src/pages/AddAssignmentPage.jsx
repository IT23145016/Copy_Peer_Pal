import { useEffect, useState } from "react";
import { ArrowLeft, BookOpenCheck, CalendarDays, FilePenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

export default function AddAssignmentPage() {
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [form, setForm] = useState({ assignmentName: "", publishedDate: "", deadline: "", deadlineTime: "23:59" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const auth = getStoredAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, modRes] = await Promise.all([api.get("/auth/me"), api.get("/modules")]);
        setProfile(meRes.data);
        setModules(modRes.data);
      } catch (err) {
        setError("Failed to load data");
      }
    };
    load();
  }, []);

  const onLogout = () => { clearStoredAuth(); navigate("/"); };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!selectedModuleId || !form.assignmentName.trim() || !form.publishedDate || !form.deadline) {
      setError("Please select a module and fill all fields");
      return;
    }
    if (form.publishedDate < today) {
      setError("Published date cannot be in the past");
      return;
    }
    if (form.deadline < form.publishedDate) {
      setError("Deadline must be on or after the published date");
      return;
    }
    try {
      setSaving(true);
      const deadlineWithTime = form.deadline && form.deadlineTime
        ? `${form.deadline}T${form.deadlineTime}:00`
        : form.deadline;
      const { data } = await api.post("/assignments", {
        moduleId: selectedModuleId,
        assignmentName: form.assignmentName.trim(),
        publishedDate: form.publishedDate,
        deadline: deadlineWithTime,
      });
      setSuccess("Assignment published successfully!");
      setForm({ assignmentName: "", publishedDate: "", deadline: "" });
      setSelectedModuleId("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish assignment");
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const selectedModule = modules.find((m) => m._id === selectedModuleId);

  return (
    <div className="pp-layout">
      <Sidebar profile={profile || auth?.user} onLogout={onLogout} />
      <main className="pp-main">

        <div className="aa-topbar">
          <button type="button" className="aa-back-btn" onClick={() => navigate("/admin/dashboard?tab=assignments")}>
            <ArrowLeft size={16} /> Back to Assignments
          </button>
          <h1 className="aa-title">Publish New Assignment</h1>
        </div>

        <div className="aa-grid">

          {/* Step 1 — pick module */}
          <div className="aa-card">
            <div className="aa-card-head">
              <div className="aa-card-icon"><BookOpenCheck size={18} /></div>
              <div>
                <h3>Step 1 — Select Module</h3>
                <p className="pp-muted">Choose the module this assignment belongs to.</p>
              </div>
            </div>
            <div className="aa-module-grid">
              {modules.map((m) => (
                <button
                  key={m._id}
                  type="button"
                  className={`aa-module-btn ${selectedModuleId === m._id ? "active" : ""}`}
                  onClick={() => setSelectedModuleId(m._id)}
                >
                  <strong>{m.moduleCode}</strong>
                  <span>{m.moduleName}</span>
                  <small>Year {m.academicYear} · Sem {m.semester}</small>
                </button>
              ))}
              {modules.length === 0 && <p className="pp-muted">No modules available. Add modules first.</p>}
            </div>
          </div>

          {/* Step 2 — fill form */}
          <div className="aa-card">
            <div className="aa-card-head">
              <div className="aa-card-icon"><FilePenLine size={18} /></div>
              <div>
                <h3>Step 2 — Assignment Details</h3>
                <p className="pp-muted">
                  {selectedModule ? `Publishing for: ${selectedModule.moduleCode} — ${selectedModule.moduleName}` : "Select a module first."}
                </p>
              </div>
            </div>

            {error ? <p className="error">{error}</p> : null}
            {success ? <p className="success">{success}</p> : null}

            <form className="aa-form" onSubmit={onSubmit} noValidate>
              <div className="aa-field">
                <label>Assignment Name</label>
                <input
                  placeholder="e.g. Lab Report 1"
                  value={form.assignmentName}
                  onChange={(e) => setForm((p) => ({ ...p, assignmentName: e.target.value }))}
                />
              </div>
              <div className="aa-form-row">
                <div className="aa-field">
                  <label><CalendarDays size={13} /> Published Date</label>
                  <input type="date" min={today} value={form.publishedDate} onChange={(e) => setForm((p) => ({ ...p, publishedDate: e.target.value }))} />
                </div>
                <div className="aa-field">
                  <label><CalendarDays size={13} /> Deadline Date</label>
                  <input type="date" min={form.publishedDate || today} value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} />
                </div>
                <div className="aa-field">
                  <label>⏰ Deadline Time</label>
                  <input type="time" value={form.deadlineTime} onChange={(e) => setForm((p) => ({ ...p, deadlineTime: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="aa-submit-btn" disabled={saving || !selectedModuleId}>
                {saving ? "Publishing..." : "Publish Assignment"}
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
