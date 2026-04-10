import { useEffect, useMemo, useState } from "react";
import { BookOpen, Camera, GraduationCap, Mail, Settings, Trash2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { clearStoredAuth, getStoredAuth, setStoredAuth } from "../utils/auth";

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", avatar: "", academicYear: "", semester: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState("info");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const auth = getStoredAuth();

  const canSubmit = useMemo(() => form.name.trim() && form.email.trim(), [form.email, form.name]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/auth/me");
        setProfile(data);
        setForm({ name: data.name || "", email: data.email || "", avatar: data.avatar || "", academicYear: String(data.academicYear || ""), semester: String(data.semester || "") });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const onLogout = () => { clearStoredAuth(); navigate("/"); };
  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    if (file.size > 1024 * 1024) { setError("Image must be less than 1MB"); return; }
    setError("");
    const dataUrl = await toDataUrl(file);
    setForm((prev) => ({ ...prev, avatar: dataUrl }));
    // Auto-save avatar immediately
    try {
      const { data } = await api.put("/auth/me", { avatar: dataUrl });
      setProfile(data.user);
      setStoredAuth({ ...auth, user: { ...auth?.user, ...data.user, avatar: data.user.avatar || "" } });
      setSuccess("Profile photo updated");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save photo");
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const normalizedName = form.name.trim();
    const normalizedEmail = form.email.trim().toLowerCase();
    if (normalizedName.length < 2) { setError("Name must be at least 2 characters"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) { setError("Enter a valid email"); return; }
    try {
      setSaving(true);
      const { data } = await api.put("/auth/me", { name: normalizedName, email: normalizedEmail, avatar: form.avatar, academicYear: Number(form.academicYear), semester: Number(form.semester) });
      setProfile(data.user);
      setForm({ name: data.user.name, email: data.user.email, avatar: data.user.avatar || "", academicYear: String(data.user.academicYear || ""), semester: String(data.user.semester || "") });
      setStoredAuth({ ...auth, user: { ...auth?.user, ...data.user, avatar: data.user.avatar || "" } });
      setSuccess("Profile updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteAccount = async () => {
    if (!window.confirm("Delete this account permanently?")) return;
    try {
      setDeleting(true);
      await api.delete("/auth/me");
      clearStoredAuth();
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  const initials = (profile?.name || auth?.user?.name || "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="pp-layout">
      <Sidebar profile={profile || auth?.user} onLogout={onLogout} />
      <main className="pp-main">
        {loading ? <p className="pp-muted">Loading...</p> : null}

        {!loading ? (
          <div className="prof-shell">

            <div className="prof-header-card">
              <div className="prof-avatar-wrap">
                {form.avatar
                  ? <img className="prof-avatar-img" src={form.avatar} alt="Profile" />
                  : <div className="prof-avatar-fallback">{initials}</div>
                }
                <label className="prof-camera-btn" title="Change photo">
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={onPhotoChange} style={{ display: "none" }} />
                </label>
              </div>
              <div className="prof-header-info">
                <h2 className="prof-name">{profile?.name || auth?.user?.name}</h2>
                <span className="prof-role-badge">{profile?.role || "student"}</span>
              </div>
            </div>

            <div className="prof-tabs">
              <button type="button" className={`prof-tab ${tab === "info" ? "active" : ""}`} onClick={() => setTab("info")}>
                <User size={15} /> Personal Info
              </button>
              <button type="button" className={`prof-tab ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>
                <Settings size={15} /> Settings
              </button>
            </div>

            {tab === "info" ? (
              <div className="prof-info-list">
                <div className="prof-info-row">
                  <span className="prof-info-icon"><Mail size={18} /></span>
                  <div>
                    <p className="prof-info-label">Email</p>
                    <p className="prof-info-value">{profile?.email || "—"}</p>
                  </div>
                </div>
                <div className="prof-info-row">
                  <span className="prof-info-icon"><GraduationCap size={18} /></span>
                  <div>
                    <p className="prof-info-label">Academic Year</p>
                    <p className="prof-info-value">Year {profile?.academicYear || "—"}</p>
                  </div>
                </div>
                <div className="prof-info-row">
                  <span className="prof-info-icon"><BookOpen size={18} /></span>
                  <div>
                    <p className="prof-info-label">Semester</p>
                    <p className="prof-info-value">Semester {profile?.semester || "—"}</p>
                  </div>
                </div>
                <div className="prof-info-row">
                  <span className="prof-info-icon"><User size={18} /></span>
                  <div>
                    <p className="prof-info-label">Batch</p>
                    <p className="prof-info-value">{profile?.batch || "—"}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {tab === "settings" ? (
              <form className="prof-settings-form" onSubmit={onSave}>
                {error ? <p className="error">{error}</p> : null}
                {success ? <p className="success">{success}</p> : null}
                <div className="prof-field">
                  <label>Full Name</label>
                  <input name="name" value={form.name} onChange={onChange} placeholder="Your name" />
                </div>
                <div className="prof-field">
                  <label>Email</label>
                  <input name="email" value={form.email} onChange={onChange} placeholder="Your email" />
                </div>
                <div className="prof-settings-row">
                  <div className="prof-field">
                    <label>Academic Year</label>
                    <select name="academicYear" value={form.academicYear} onChange={onChange}>
                      <option value="">Select year</option>
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                    </select>
                  </div>
                  <div className="prof-field">
                    <label>Semester</label>
                    <select name="semester" value={form.semester} onChange={onChange}>
                      <option value="">Select semester</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                  </div>
                </div>
                <div className="prof-settings-actions">
                  <button type="submit" className="prof-save-btn" disabled={!canSubmit || saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" className="prof-delete-btn" onClick={onDeleteAccount} disabled={deleting}>
                    <Trash2 size={14} /> {deleting ? "Deleting..." : "Delete Account"}
                  </button>
                </div>
              </form>
            ) : null}

          </div>
        ) : null}
      </main>
    </div>
  );
}
