import { useEffect, useState } from "react";
import { AlarmClock, BookOpenCheck, ClipboardList, Crown, FilePenLine, LibraryBig, ShieldCheck, Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

export default function AdminDashboardPage() {
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [userFilters, setUserFilters] = useState({
    year: "",
    semester: "",
    batch: "",
  });
  const [assignments, setAssignments] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [assignmentForm, setAssignmentForm] = useState({
    assignmentName: "",
    publishedDate: "",
    deadline: "",
  });
  const [moduleForm, setModuleForm] = useState({
    moduleCode: "",
    moduleName: "",
    academicYear: "1",
    semester: "1",
  });
  const [activeSection, setActiveSection] = useState("dashboard");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [editingModuleId, setEditingModuleId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [savingModule, setSavingModule] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = getStoredAuth();
  const adminMenuItems = [
    { key: "dashboard", label: "Dashboard", icon: <ShieldCheck size={16} /> },
    { key: "assignments", label: "Assignments", icon: <ClipboardList size={16} /> },
    { key: "modules", label: "Modules", icon: <LibraryBig size={16} /> },
    { key: "users", label: "Users", icon: <Users size={16} /> },
  ];

  const loadData = async (filters = userFilters) => {
    try {
      const params = new URLSearchParams();
      params.set("role", "user");
      if (filters.year) params.set("year", filters.year);
      if (filters.semester) params.set("semester", filters.semester);
      if (filters.batch.trim()) params.set("batch", filters.batch.trim());

      const [meResponse, adminAccessResponse, assignmentsResponse, modulesResponse, usersResponse] = await Promise.all([
        api.get("/auth/me"),
        api.get("/auth/admin/dashboard"),
        api.get("/assignments"),
        api.get("/modules"),
        api.get(`/admin/users?${params.toString()}`),
      ]);

      if (adminAccessResponse.data.role !== "admin") {
        navigate("/dashboard", { replace: true });
        return;
      }

      setProfile(meResponse.data);
      setAssignments(assignmentsResponse.data);
      setModules(modulesResponse.data);
      setUsers(usersResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin dashboard data");
    }
  };

  useEffect(() => {
    loadData(userFilters);
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (["dashboard", "assignments", "modules", "users"].includes(tab)) {
      setActiveSection(tab);
    } else {
      setActiveSection("dashboard");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!status && !error) return;
    const type = error ? "error" : "success";
    const message = error || status;
    setToast({ show: true, type, message });
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
    return () => clearTimeout(timer);
  }, [status, error]);

  const onLogout = () => {
    clearStoredAuth();
    navigate("/");
  };

  const onAddAssignment = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");

    if (!selectedModuleId || !assignmentForm.assignmentName.trim() || !assignmentForm.publishedDate || !assignmentForm.deadline) {
      setError("Select module, assignment name, published date and deadline");
      return;
    }

    try {
      setSavingAssignment(true);
      const { data } = await api.post("/assignments", {
        moduleId: selectedModuleId,
        assignmentName: assignmentForm.assignmentName.trim(),
        publishedDate: assignmentForm.publishedDate,
        deadline: assignmentForm.deadline,
      });
      setAssignmentForm({ assignmentName: "", publishedDate: "", deadline: "" });
      setSelectedModuleId("");
      const notice = data?.emailNotice;
      if (notice) {
        if (notice.skipped) {
          setStatus(`Assignment published. Email skipped (${notice.reason || "SMTP not configured or no recipients"}).`);
        } else if (typeof notice.sentCount === "number") {
          setStatus(
            `Assignment published. Email sent to ${notice.sentCount} user(s)${
              notice.dueSoonNotification ? " (urgent due-soon alert)." : "."
            }`
          );
        } else {
          setStatus(`Assignment published. Email status: ${notice.reason || "unknown"}.`);
        }
      } else {
        setStatus("Assignment published successfully");
      }
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish assignment");
    } finally {
      setSavingAssignment(false);
    }
  };

  const onAddModule = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");

    if (!moduleForm.moduleCode.trim() || !moduleForm.moduleName.trim()) {
      setError("Module code and module name are required");
      return;
    }

    try {
      setSavingModule(true);
      const payload = {
        moduleCode: moduleForm.moduleCode.trim().toUpperCase(),
        moduleName: moduleForm.moduleName.trim(),
        academicYear: Number(moduleForm.academicYear),
        semester: Number(moduleForm.semester),
      };

      if (editingModuleId) {
        await api.put(`/modules/${editingModuleId}`, payload);
        setStatus("Module updated successfully");
      } else {
        await api.post("/modules", payload);
        setStatus("Module added successfully");
      }

      setModuleForm({
        moduleCode: "",
        moduleName: "",
        academicYear: "1",
        semester: "1",
      });
      setEditingModuleId("");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save module");
    } finally {
      setSavingModule(false);
    }
  };

  const onEditModule = (moduleItem) => {
    setModuleForm({
      moduleCode: moduleItem.moduleCode || "",
      moduleName: moduleItem.moduleName || "",
      academicYear: String(moduleItem.academicYear || "1"),
      semester: String(moduleItem.semester || "1"),
    });
    setEditingModuleId(moduleItem._id);
  };

  const onDeleteModule = async (id) => {
    try {
      setError("");
      setStatus("");
      await api.delete(`/modules/${id}`);
      if (editingModuleId === id) {
        setEditingModuleId("");
        setModuleForm({
          moduleCode: "",
          moduleName: "",
          academicYear: "1",
          semester: "1",
        });
      }
      setStatus("Module deleted successfully");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete module");
    }
  };

  const onToggleUserStatus = async (user) => {
    try {
      setError("");
      setStatus("");
      await api.patch(`/admin/users/${user._id}/status`, { isActive: !(user.isActive === false) });
      setStatus(`User ${user.isActive === false ? "activated" : "deactivated"} successfully`);
      await loadData(userFilters);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user status");
    }
  };

  const onToggleBatchTop = async (user) => {
    try {
      setError("");
      setStatus("");
      let moduleSpecialization = user.moduleSpecialization || "";
      const nextValue = !user.isBatchTop;
      if (nextValue) {
        moduleSpecialization = window.prompt("Enter module specialization for this Batch Top (e.g. ITPM):", moduleSpecialization) || "";
      }
      await api.patch(`/admin/users/${user._id}/batch-top`, {
        isBatchTop: nextValue,
        moduleSpecialization,
      });
      setStatus(nextValue ? "User marked as Batch Top" : "Batch Top role removed");
      await loadData(userFilters);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update Batch Top status");
    }
  };

  const onFilterChange = (e) => {
    setUserFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onApplyFilters = async () => {
    setError("");
    setStatus("");
    await loadData(userFilters);
  };

  const onResetFilters = async () => {
    const reset = { year: "", semester: "", batch: "" };
    setUserFilters(reset);
    setError("");
    setStatus("");
    await loadData(reset);
  };

  return (
    <div className="pp-layout">
      {toast.show ? (
        <div className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          <strong>{toast.type === "error" ? "Error" : "Notification"}</strong>
          <p>{toast.message}</p>
        </div>
      ) : null}
      <Sidebar
        profile={profile || auth?.user}
        onLogout={onLogout}
        menuItems={adminMenuItems}
        activeMenu={activeSection}
        onMenuSelect={setActiveSection}
        onHomeClick={() => navigate("/admin/dashboard?tab=dashboard")}
      />
      <main className="pp-main">

        <div className="pp-welcome">
          <div>
            <h1 className="pp-welcome-name">Welcome back, {profile?.name?.split(" ")[0] || auth?.user?.name?.split(" ")[0] || "Admin"} 👋</h1>
            <p className="pp-welcome-sub">Here's your admin overview for today.</p>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {status ? <p className="success">{status}</p> : null}

        {activeSection === "dashboard" ? (
          <div className="adm-dashboard">

            {/* Top stat cards */}
            <div className="adm-stats-row">
              <article className="adm-stat-card adm-stat-orange">
                <div className="adm-stat-icon"><ClipboardList size={22} /></div>
                <div>
                  <p className="adm-stat-label">Total Assignments</p>
                  <p className="adm-stat-num">{assignments.length}</p>
                </div>
              </article>
              <article className="adm-stat-card adm-stat-soft">
                <div className="adm-stat-icon"><LibraryBig size={22} /></div>
                <div>
                  <p className="adm-stat-label">Total Modules</p>
                  <p className="adm-stat-num">{modules.length}</p>
                </div>
              </article>
              <article className="adm-stat-card adm-stat-green">
                <div className="adm-stat-icon"><Users size={22} /></div>
                <div>
                  <p className="adm-stat-label">Total Students</p>
                  <p className="adm-stat-num">{users.length}</p>
                </div>
              </article>
            </div>

            {/* Main two-column grid */}
            <div className="adm-main-grid">

              {/* Left column */}
              <div className="adm-left">

                {/* Recent Assignments */}
                <div className="adm-section-head">
                  <h3>Recent Assignments</h3>
                  <button type="button" className="adm-see-all" onClick={() => navigate("/admin/dashboard?tab=assignments")}>See all</button>
                </div>
                <div className="adm-assign-cards">
                  {assignments.slice(0, 4).map((item, i) => {
                    const daysLeft = Math.ceil((new Date(item.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                    const isOverdue = daysLeft < 0;
                    const isOrange = i % 2 === 0;
                    return (
                      <article key={item._id} className={`adm-assign-card ${isOrange ? "adm-assign-orange" : "adm-assign-white"} ${isOverdue ? "aa-pub-overdue" : ""}`}>
                        <div className="adm-assign-top">
                          <p className="adm-assign-code">{item.moduleCode}</p>
                          <span className={`adm-assign-clock ${isOverdue ? "adm-clock-red" : ""}`}>
                            <AlarmClock size={15} />
                          </span>
                        </div>
                        <h4 className="adm-assign-name">{item.assignmentName}</h4>
                        <div className="adm-assign-meta">
                          <span>📅 {new Date(item.publishedDate).toLocaleDateString()}</span>
                        </div>
                        <div className="adm-assign-footer">
                          <div className="adm-progress-bar">
                            <div className="adm-progress-fill" style={{ width: daysLeft > 0 ? `${Math.min(100, Math.round((1 - daysLeft / 30) * 100))}%` : "100%" }} />
                          </div>
                          <span className="adm-days-chip">{isOverdue ? "Overdue" : `${daysLeft}d left`}</span>
                        </div>
                      </article>
                    );
                  })}
                  {assignments.length === 0 && <p className="pp-muted">No assignments yet.</p>}
                </div>

                {/* Recent Modules */}
                <div className="adm-section-head" style={{ marginTop: "1.4rem" }}>
                  <h3>Recent Modules</h3>
                  <button type="button" className="adm-see-all" onClick={() => navigate("/admin/dashboard?tab=modules")}>See all</button>
                </div>
                <div className="adm-module-rows">
                  {modules.slice(0, 5).map((item) => (
                    <div key={item._id} className="adm-module-row">
                      <div className="adm-module-dot" />
                      <div className="adm-module-info">
                        <strong>{item.moduleCode}</strong>
                        <span>{item.moduleName}</span>
                      </div>
                      <span className="adm-module-badge">Y{item.academicYear} S{item.semester}</span>
                    </div>
                  ))}
                  {modules.length === 0 && <p className="pp-muted">No modules yet.</p>}
                </div>
              </div>

              {/* Right column */}
              <div className="adm-right">

                {/* Recent Students */}
                <div className="adm-section-head">
                  <h3>Recent Students</h3>
                  <button type="button" className="adm-see-all" onClick={() => navigate("/admin/dashboard?tab=users")}>See all</button>
                </div>
                <div className="adm-student-list">
                  {users.slice(0, 6).map((user) => {
                    const initials = (user.name || "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
                    const isActive = user.isActive !== false;
                    return (
                      <div key={user._id} className="adm-student-row">
                        <div className="adm-student-avatar">{initials}</div>
                        <div className="adm-student-info">
                          <strong>{user.name}</strong>
                          <span>Y{user.academicYear || "-"} · Sem {user.semester || "-"} · {user.batch || "No batch"}</span>
                        </div>
                        <span className={`adm-status-dot ${isActive ? "adm-dot-active" : "adm-dot-inactive"}`}>{isActive ? "Active" : "Inactive"}</span>
                      </div>
                    );
                  })}
                  {users.length === 0 && <p className="pp-muted">No students yet.</p>}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeSection === "assignments" ? (
          <div className="aa-assignments-view">
            <div className="aa-view-topbar">
              <div>
                <h2 className="aa-view-title">Published Assignments</h2>
                <p className="pp-muted">{assignments.length} assignment(s) published</p>
              </div>
              <button type="button" className="aa-add-btn" onClick={() => navigate("/admin/assignments/add")}>
                + Add Assignment
              </button>
            </div>

            <div className="aa-filter-tabs">
              {["all", "soon_due", "recently_published"].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`aa-filter-tab ${assignmentFilter === f ? "active" : ""}`}
                  onClick={() => setAssignmentFilter(f)}
                >
                  {f === "all" ? "All" : f === "soon_due" ? "Soon Due" : "Recently Published"}
                </button>
              ))}
            </div>

            <div className="aa-published-grid">
              {(() => {
                const now = new Date();
                let filtered = assignments.map((item) => ({
                  ...item,
                  daysLeft: Math.ceil((new Date(item.deadline) - now) / (1000 * 60 * 60 * 24)),
                }));
                if (assignmentFilter === "soon_due") {
                  filtered = filtered.filter((i) => i.daysLeft >= 0 && i.daysLeft <= 3).sort((a, b) => a.daysLeft - b.daysLeft);
                } else if (assignmentFilter === "recently_published") {
                  filtered = filtered
                    .filter((i) => Math.ceil((now - new Date(i.publishedDate)) / (1000 * 60 * 60 * 24)) <= 7)
                    .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
                }
                if (!filtered.length) return <p className="pp-muted">No assignments match this filter.</p>;
                return filtered.map((item, i) => {
                  const isOverdue = item.daysLeft < 0;
                  return (
                    <article key={item._id} className={`aa-pub-card ${isOverdue ? "aa-pub-overdue" : ""}`}>
                      <div className="aa-pub-top">
                        <span className="aa-pub-code">{item.moduleCode}</span>
                        <span className={`aa-pub-clock ${isOverdue ? "aa-clock-red" : ""}`}><AlarmClock size={14} /></span>
                      </div>
                      <h4 className="aa-pub-name">{item.assignmentName}</h4>
                      <div className="aa-pub-dates">
                        <span>📅 {new Date(item.publishedDate).toLocaleDateString()}</span>
                        <span>⏰ {new Date(item.deadline).toLocaleString()}</span>
                      </div>
                      <div className="aa-pub-footer">
                        <div className="aa-progress-bar">
                          <div className="aa-progress-fill" style={{ width: isOverdue ? "100%" : `${Math.min(100, Math.round((1 - item.daysLeft / 30) * 100))}%` }} />
                        </div>
                        <span className={`aa-days-chip ${isOverdue ? "aa-chip-red" : ""}`}>
                          {isOverdue ? "Overdue" : `${item.daysLeft}d left`}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="aa-delete-btn"
                        onClick={() => setConfirmDelete({ id: item._id, name: item.assignmentName })}
                      >
                        Delete
                      </button>
                    </article>
                  );
                });
              })()}
            </div>
          </div>
        ) : null}

        {activeSection === "modules" ? (
          <div className="aa-assignments-view">
            <div className="aa-view-topbar">
              <div>
                <h2 className="aa-view-title">Modules</h2>
                <p className="pp-muted">{modules.length} module(s) available</p>
              </div>
              <button type="button" className="aa-add-btn" onClick={() => navigate("/admin/modules/add")}>
                + Add Module
              </button>
            </div>
            <div className="aa-published-grid">
              {modules.length ? modules.map((item) => (
                <article key={item._id} className="aa-pub-card">
                  <div className="aa-pub-top">
                    <span className="aa-pub-code">{item.moduleCode}</span>
                    <span className="aa-pub-clock"><BookOpenCheck size={14} /></span>
                  </div>
                  <h4 className="aa-pub-name">{item.moduleName}</h4>
                  <div className="aa-pub-dates">
                    <span>Year {item.academicYear}</span>
                    <span>Semester {item.semester}</span>
                  </div>
                  <div className="aa-mod-actions">
                    <button type="button" className="aa-edit-btn" onClick={() => navigate(`/admin/modules/add?edit=${item._id}`)}>Edit</button>
                    <button type="button" className="aa-delete-btn" onClick={() => setConfirmDelete({ id: item._id, name: item.moduleName, type: "module" })}>Delete</button>
                  </div>
                </article>
              )) : <p className="pp-muted">No modules yet.</p>}
            </div>
          </div>
        ) : null}

        {activeSection === "users" ? (
          <div className="aa-assignments-view">
            <div className="aa-view-topbar">
              <div>
                <h2 className="aa-view-title">Students</h2>
                <p className="pp-muted">{users.length} student(s) registered</p>
              </div>
              <div className="usr-filter-row">
                <select name="year" value={userFilters.year} onChange={onFilterChange}>
                  <option value="">All Years</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
                <select name="semester" value={userFilters.semester} onChange={onFilterChange}>
                  <option value="">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
                <input name="batch" placeholder="Batch" value={userFilters.batch} onChange={onFilterChange} />
                <button type="button" className="aa-add-btn" onClick={onApplyFilters}>Filter</button>
                <button type="button" className="aa-edit-btn" style={{padding:"0.5rem 1rem"}} onClick={onResetFilters}>Reset</button>
              </div>
            </div>

            <div className="usr-list">
              {users.map((user) => {
                const isActive = user.isActive !== false;
                const canToggle = String(user._id) !== String(profile?._id);
                const initials = (user.name || "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={user._id} className="usr-row">
                    <div className="usr-avatar-wrap">
                      {user.avatar
                        ? <img className="usr-avatar" src={user.avatar} alt={user.name} />
                        : <div className="usr-avatar usr-avatar-fallback">{initials}</div>
                      }
                      <span className={`usr-status-dot ${isActive ? "usr-dot-active" : "usr-dot-inactive"}`} />
                    </div>
                    <div className="usr-info">
                      <div className="usr-info-top">
                        <strong className="usr-name">{user.name}</strong>
                        {user.isBatchTop ? <span className="usr-top-badge"><Crown size={11} /> {user.moduleSpecialization || "Batch Top"}</span> : null}
                      </div>
                      <p className="usr-meta">{user.email}</p>
                      <p className="usr-meta">Year {user.academicYear || "—"} · Sem {user.semester || "—"} · {user.batch || "No batch"}</p>
                    </div>
                    <div className="usr-actions">
                      <button
                        type="button"
                        className={`usr-action-btn ${user.isBatchTop ? "usr-btn-active" : ""}`}
                        onClick={() => onToggleBatchTop(user)}
                        title={user.isBatchTop ? "Remove Batch Top" : "Mark Batch Top"}
                      >
                        <Crown size={14} />
                      </button>
                      <button
                        type="button"
                        className={`usr-action-btn ${isActive ? "usr-btn-danger" : "usr-btn-success"}`}
                        onClick={() => onToggleUserStatus(user)}
                        disabled={!canToggle}
                      >
                        {isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                );
              })}
              {users.length === 0 && <p className="pp-muted">No students found.</p>}
            </div>
          </div>
        ) : null}
      </main>
      {confirmDelete ? (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3 className="confirm-title">Delete Assignment</h3>
            <p className="confirm-msg">Are you sure you want to delete <strong>"{confirmDelete.name}"</strong>? This cannot be undone.</p>
            <div className="confirm-actions">
              <button type="button" className="confirm-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                type="button"
                className="confirm-delete"
                onClick={async () => {
                  try {
                    if (confirmDelete.type === "module") {
                      await api.delete(`/modules/${confirmDelete.id}`);
                    } else {
                      await api.delete(`/assignments/${confirmDelete.id}`);
                    }
                    setStatus(`${confirmDelete.type === "module" ? "Module" : "Assignment"} deleted`);
                    setConfirmDelete(null);
                    await loadData();
                  } catch (err) {
                    setError(err.response?.data?.message || "Failed to delete");
                    setConfirmDelete(null);
                  }
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
