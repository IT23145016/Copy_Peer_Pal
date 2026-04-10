import { useEffect, useState } from "react";
import { ArrowLeft, BookOpenCheck } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

export default function AddModulePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ moduleCode: "", moduleName: "", academicYear: "1", semester: "1" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const auth = getStoredAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await api.get("/auth/me");
        setProfile(meRes.data);
        if (editId) {
          const modRes = await api.get("/modules");
          const mod = modRes.data.find((m) => m._id === editId);
          if (mod) setForm({ moduleCode: mod.moduleCode, moduleName: mod.moduleName, academicYear: String(mod.academicYear), semester: String(mod.semester) });
        }
      } catch { setError("Failed to load data"); }
    };
    load();
  }, [editId]);

  const onLogout = () => { clearStoredAuth(); navigate("/"); };
  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.moduleCode.trim() || !form.moduleName.trim()) {
      setError("Module code and name are required");
      return;
    }
    try {
      setSaving(true);
      const payload = { moduleCode: form.moduleCode.trim().toUpperCase(), moduleName: form.moduleName.trim(), academicYear: Number(form.academicYear), semester: Number(form.semester) };
      if (editId) {
        await api.put(`/modules/${editId}`, payload);
        setSuccess("Module updated successfully!");
      } else {
        await api.post("/modules", payload);
        setSuccess("Module added successfully!");
        setForm({ moduleCode: "", moduleName: "", academicYear: "1", semester: "1" });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save module");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pp-layout">
      <Sidebar profile={profile || auth?.user} onLogout={onLogout} />
      <main className="pp-main">
        <div className="aa-topbar">
          <button type="button" className="aa-back-btn" onClick={() => navigate("/admin/dashboard?tab=modules")}>
            <ArrowLeft size={16} /> Back to Modules
          </button>
          <h1 className="aa-title">{editId ? "Edit Module" : "Add New Module"}</h1>
        </div>

        <div className="mod-form-wrap">
          <div className="aa-card">
            <div className="aa-card-head">
              <div className="aa-card-icon"><BookOpenCheck size={18} /></div>
              <div>
                <h3>{editId ? "Update Module Details" : "Module Details"}</h3>
                <p className="pp-muted">Fill in the module information below.</p>
              </div>
            </div>

            {error ? <p className="error">{error}</p> : null}
            {success ? <p className="success">{success}</p> : null}

            <form className="aa-form" onSubmit={onSubmit} noValidate>
              <div className="aa-field">
                <label>Module Code</label>
                <input name="moduleCode" value={form.moduleCode} onChange={onChange} placeholder="e.g. IT2030" />
              </div>
              <div className="aa-field">
                <label>Module Name</label>
                <input name="moduleName" value={form.moduleName} onChange={onChange} placeholder="e.g. Web Development" />
              </div>
              <div className="aa-form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="aa-field">
                  <label>Academic Year</label>
                  <select name="academicYear" value={form.academicYear} onChange={onChange}>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                </div>
                <div className="aa-field">
                  <label>Semester</label>
                  <select name="semester" value={form.semester} onChange={onChange}>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="aa-submit-btn" disabled={saving}>
                {saving ? "Saving..." : editId ? "Update Module" : "Add Module"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
