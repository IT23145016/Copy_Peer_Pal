import { useEffect, useState } from "react";
import { AlarmClock, BookOpenCheck, ClipboardList, Crown, FilePenLine, LibraryBig, ShieldCheck, Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

const ADMIN_TABS = ["dashboard", "assignments", "modules", "users"];

export default function AdminDashboardPage() {
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [userFilters, setUserFilters] = useState({
    year: "",
    semester: "",
    batch: "",
  });
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [assignmentFilters, setAssignmentFilters] = useState({
    year: "",
    semester: "",
  });
  const [activeSection, setActiveSection] = useState("dashboard");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });
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
    setActiveSection(ADMIN_TABS.includes(tab) ? tab : "dashboard");
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

  const onFilterChange = (e) => {
    setUserFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onAssignmentFilterChange = (e) => {
    setAssignmentFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

  const onResetAssignmentFilters = () => {
    setAssignmentFilter("all");
    setAssignmentFilters({ year: "", semester: "" });
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
        moduleSpecialization =
          window.prompt("Enter module specialization for this Batch Top (e.g. ITPM):", moduleSpecialization) || "";
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

  const filteredAssignments = (() => {
    const now = new Date();
    let filtered = assignments.map((item) => ({
      ...item,
      daysLeft: Math.ceil((new Date(item.deadline) - now) / (1000 * 60 * 60 * 24)),
    }));

    if (assignmentFilter === "soon_due") {
      filtered = filtered.filter((item) => item.daysLeft >= 0 && item.daysLeft <= 3).sort((a, b) => a.daysLeft - b.daysLeft);
    } else if (assignmentFilter === "recently_published") {
      filtered = filtered
        .filter((item) => Math.ceil((now - new Date(item.publishedDate)) / (1000 * 60 * 60 * 24)) <= 7)
        .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
    }

    if (assignmentFilters.year) {
      filtered = filtered.filter((item) => String(item.academicYear) === assignmentFilters.year);
    }

    if (assignmentFilters.semester) {
      filtered = filtered.filter((item) => String(item.semester) === assignmentFilters.semester);
    }

    return filtered;
  })();

  const activeUsersCount = users.filter((user) => user.isActive !== false).length;
  const batchTopCount = users.filter((user) => user.isBatchTop).length;
  const dueSoonAssignments = filteredAssignments
    .filter((item) => item.daysLeft >= 0 && item.daysLeft <= 3)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  const overdueAssignments = filteredAssignments
    .filter((item) => item.daysLeft < 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  const recentAssignments = [...filteredAssignments]
    .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate))
    .slice(0, 3);
  const recentModules = [...modules]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 3);
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 3);
  const needsAttentionItems = [
    ...overdueAssignments.map((item) => ({ ...item, attentionType: "overdue" })),
    ...dueSoonAssignments.map((item) => ({ ...item, attentionType: "soon" })),
  ].slice(0, 3);

  return (
    <div className="pp-layout adm-page-shell">
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
            <h1 className="pp-welcome-name">Welcome back, {profile?.name?.split(" ")[0] || auth?.user?.name?.split(" ")[0] || "Admin"}</h1>
            <p className="pp-welcome-sub">Here is a simpler overview of your admin workspace.</p>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {status ? <p className="success">{status}</p> : null}

        {activeSection === "dashboard" ? (
          <div className="adm-dashboard-clean">
            <section className="adm-overview-hero">
              <div className="adm-overview-actions">
                <button
                  type="button"
                  className="adm-quick-action adm-quick-action-primary"
                  onClick={() => navigate("/admin/assignments/add")}
                >
                  <FilePenLine size={18} />
                  <span>Publish Assignment</span>
                </button>
                <button type="button" className="adm-quick-action" onClick={() => navigate("/admin/modules/add")}>
                  <LibraryBig size={18} />
                  <span>Add Module</span>
                </button>
                <button type="button" className="adm-quick-action" onClick={() => navigate("/admin/dashboard?tab=users")}>
                  <Users size={18} />
                  <span>Manage Students</span>
                </button>
                <button type="button" className="adm-quick-action" onClick={() => navigate("/helpdesk")}>
                  <ShieldCheck size={18} />
                  <span>Open Help Desk</span>
                </button>
              </div>
            </section>

            <section className="adm-summary-grid">
              <article className="adm-summary-card">
                <div className="adm-summary-icon">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <p className="adm-summary-label">Assignments</p>
                  <p className="adm-summary-value">{assignments.length}</p>
                  <p className="adm-summary-note">Due soon: {dueSoonAssignments.length}</p>
                </div>
              </article>
              <article className="adm-summary-card">
                <div className="adm-summary-icon">
                  <LibraryBig size={20} />
                </div>
                <div>
                  <p className="adm-summary-label">Modules</p>
                  <p className="adm-summary-value">{modules.length}</p>
                  <p className="adm-summary-note">All modules</p>
                </div>
              </article>
              <article className="adm-summary-card">
                <div className="adm-summary-icon">
                  <Users size={20} />
                </div>
                <div>
                  <p className="adm-summary-label">Active students</p>
                  <p className="adm-summary-value">{activeUsersCount}</p>
                  <p className="adm-summary-note">Total: {users.length}</p>
                </div>
              </article>
              <article className="adm-summary-card">
                <div className="adm-summary-icon">
                  <Crown size={20} />
                </div>
                <div>
                  <p className="adm-summary-label">Batch tops</p>
                  <p className="adm-summary-value">{batchTopCount}</p>
                  <p className="adm-summary-note">Leaders</p>
                </div>
              </article>
            </section>

            <section className="adm-focus-grid">
              <article className="adm-focus-panel adm-focus-panel-priority">
                <div className="adm-focus-head">
                  <div>
                    <span className="adm-focus-eyebrow">Needs attention</span>
                    <h3>Assignment deadlines</h3>
                  </div>
                  <button type="button" className="adm-text-link" onClick={() => navigate("/admin/dashboard?tab=assignments")}>
                    View assignments
                  </button>
                </div>

                <div className="adm-alert-stack">
                  {needsAttentionItems.map((item) => (
                    <article
                      key={item._id}
                      className={`adm-alert-card ${item.attentionType === "overdue" ? "adm-alert-overdue" : ""}`}
                    >
                      <div className="adm-alert-top">
                        <strong>{item.moduleCode}</strong>
                        <span className={`adm-alert-chip ${item.attentionType === "overdue" ? "adm-alert-chip-danger" : ""}`}>
                          {item.attentionType === "overdue"
                            ? "Overdue"
                            : item.daysLeft === 0
                              ? "Due today"
                              : `${item.daysLeft} day(s) left`}
                        </span>
                      </div>
                      <p>{item.assignmentName}</p>
                      <small>Deadline: {new Date(item.deadline).toLocaleString()}</small>
                    </article>
                  ))}

                  {!overdueAssignments.length && !dueSoonAssignments.length ? (
                    <p className="pp-muted">No overdue or due-soon assignments right now.</p>
                  ) : null}
                </div>
              </article>

              <article className="adm-focus-panel">
                <div className="adm-focus-head">
                  <div>
                    <span className="adm-focus-eyebrow">Recently published</span>
                    <h3>Latest assignments</h3>
                  </div>
                  <button type="button" className="adm-text-link" onClick={() => navigate("/admin/dashboard?tab=assignments")}>
                    See all
                  </button>
                </div>

                <div className="adm-simple-list">
                  {recentAssignments.length ? (
                    recentAssignments.map((item) => (
                      <article key={item._id} className="adm-simple-row">
                        <div className="adm-simple-main">
                          <strong>{item.assignmentName}</strong>
                          <span>
                            {item.moduleCode} • Published {new Date(item.publishedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`adm-pill ${item.daysLeft < 0 ? "adm-pill-danger" : ""}`}>
                          {item.daysLeft < 0 ? "Overdue" : `${item.daysLeft}d left`}
                        </span>
                      </article>
                    ))
                  ) : (
                    <p className="pp-muted">No assignments published yet.</p>
                  )}
                </div>
              </article>
            </section>

            <section className="adm-detail-grid">
              <article className="adm-focus-panel">
                <div className="adm-focus-head">
                  <div>
                    <span className="adm-focus-eyebrow">Modules</span>
                    <h3>Recently added modules</h3>
                  </div>
                  <button type="button" className="adm-text-link" onClick={() => navigate("/admin/dashboard?tab=modules")}>
                    Manage modules
                  </button>
                </div>

                <div className="adm-simple-list">
                  {recentModules.length ? (
                    recentModules.map((item) => (
                      <article key={item._id} className="adm-simple-row">
                        <div className="adm-simple-main">
                          <strong>{item.moduleCode}</strong>
                          <span>{item.moduleName}</span>
                        </div>
                        <span className="adm-pill">Y{item.academicYear} S{item.semester}</span>
                      </article>
                    ))
                  ) : (
                    <p className="pp-muted">No modules available yet.</p>
                  )}
                </div>
              </article>

              <article className="adm-focus-panel">
                <div className="adm-focus-head">
                  <div>
                    <span className="adm-focus-eyebrow">Student access</span>
                    <h3>Recent students</h3>
                  </div>
                  <button type="button" className="adm-text-link" onClick={() => navigate("/admin/dashboard?tab=users")}>
                    Manage students
                  </button>
                </div>

                <div className="adm-student-list-clean">
                  {recentUsers.length ? (
                    recentUsers.map((user) => {
                      const initials = (user.name || "U")
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      const isActive = user.isActive !== false;

                      return (
                        <article key={user._id} className="adm-student-row-clean">
                          <div className="adm-student-avatar">{initials}</div>
                          <div className="adm-simple-main">
                            <strong>{user.name}</strong>
                            <span>
                              Year {user.academicYear || "-"} • Semester {user.semester || "-"} • {user.batch || "No batch"}
                            </span>
                          </div>
                          <span className={`adm-pill ${isActive ? "" : "adm-pill-danger"}`}>
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </article>
                      );
                    })
                  ) : (
                    <p className="pp-muted">No students registered yet.</p>
                  )}
                </div>
              </article>
            </section>
          </div>
        ) : null}

        {activeSection === "assignments" ? (
          <div className="aa-assignments-view">
            <div className="aa-view-topbar">
              <div>
                <h2 className="aa-view-title">Published Assignments</h2>
                <p className="pp-muted">
                  Showing {filteredAssignments.length} of {assignments.length} assignment(s)
                </p>
              </div>
              <button type="button" className="aa-add-btn" onClick={() => navigate("/admin/assignments/add")}>
                + Add Assignment
              </button>
            </div>

            <div className="aa-filter-tabs">
              {["all", "soon_due", "recently_published"].map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  className={`aa-filter-tab ${assignmentFilter === filterKey ? "active" : ""}`}
                  onClick={() => setAssignmentFilter(filterKey)}
                >
                  {filterKey === "all" ? "All" : filterKey === "soon_due" ? "Soon Due" : "Recently Published"}
                </button>
              ))}
            </div>

            <div className="aa-filter-row">
              <select name="year" value={assignmentFilters.year} onChange={onAssignmentFilterChange}>
                <option value="">All Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
              <select name="semester" value={assignmentFilters.semester} onChange={onAssignmentFilterChange}>
                <option value="">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
              <button type="button" className="aa-filter-reset-btn" onClick={onResetAssignmentFilters}>
                Reset
              </button>
            </div>

            <div className="aa-published-grid">
              {filteredAssignments.length ? (
                filteredAssignments.map((item) => {
                  const isOverdue = item.daysLeft < 0;

                  return (
                    <article key={item._id} className={`aa-pub-card ${isOverdue ? "aa-pub-overdue" : ""}`}>
                      <div className="aa-pub-top">
                        <span className="aa-pub-code">{item.moduleCode}</span>
                        <span className={`aa-pub-clock ${isOverdue ? "aa-clock-red" : ""}`}>
                          <AlarmClock size={14} />
                        </span>
                      </div>
                      <h4 className="aa-pub-name">{item.assignmentName}</h4>
                      <div className="aa-pub-dates">
                        <span>Year {item.academicYear}</span>
                        <span>Semester {item.semester}</span>
                      </div>
                      <div className="aa-pub-dates">
                        <span>Published {new Date(item.publishedDate).toLocaleDateString()}</span>
                        <span>Deadline {new Date(item.deadline).toLocaleString()}</span>
                      </div>
                      <div className="aa-pub-footer">
                        <div className="aa-progress-bar">
                          <div
                            className="aa-progress-fill"
                            style={{ width: isOverdue ? "100%" : `${Math.min(100, Math.round((1 - item.daysLeft / 30) * 100))}%` }}
                          />
                        </div>
                        <span className={`aa-days-chip ${isOverdue ? "aa-chip-red" : ""}`}>
                          {isOverdue ? "Overdue" : `${item.daysLeft}d left`}
                        </span>
                      </div>
                      <div className="aa-card-actions">
                        <button
                          type="button"
                          className="aa-update-btn"
                          onClick={() => navigate(`/admin/assignments/add?edit=${item._id}`, { state: { assignment: item } })}
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          className="aa-delete-btn"
                          onClick={() => setConfirmDelete({ id: item._id, name: item.assignmentName })}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="pp-muted">No assignments match this filter.</p>
              )}
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
              {modules.length ? (
                modules.map((item) => (
                  <article key={item._id} className="aa-pub-card">
                    <div className="aa-pub-top">
                      <span className="aa-pub-code">{item.moduleCode}</span>
                      <span className="aa-pub-clock">
                        <BookOpenCheck size={14} />
                      </span>
                    </div>
                    <h4 className="aa-pub-name">{item.moduleName}</h4>
                    <div className="aa-pub-dates">
                      <span>Year {item.academicYear}</span>
                      <span>Semester {item.semester}</span>
                    </div>
                    <div className="aa-mod-actions">
                      <button type="button" className="aa-edit-btn" onClick={() => navigate(`/admin/modules/add?edit=${item._id}`)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="aa-delete-btn"
                        onClick={() => setConfirmDelete({ id: item._id, name: item.moduleName, type: "module" })}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="pp-muted">No modules yet.</p>
              )}
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
                <button type="button" className="aa-add-btn" onClick={onApplyFilters}>
                  Filter
                </button>
                <button type="button" className="aa-edit-btn" style={{ padding: "0.5rem 1rem" }} onClick={onResetFilters}>
                  Reset
                </button>
              </div>
            </div>

            <div className="usr-list">
              {users.length ? (
                users.map((user) => {
                  const isActive = user.isActive !== false;
                  const canToggle = String(user._id) !== String(profile?._id);
                  const initials = (user.name || "U")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div key={user._id} className="usr-row">
                      <div className="usr-avatar-wrap">
                        {user.avatar ? (
                          <img className="usr-avatar" src={user.avatar} alt={user.name} />
                        ) : (
                          <div className="usr-avatar usr-avatar-fallback">{initials}</div>
                        )}
                        <span className={`usr-status-dot ${isActive ? "usr-dot-active" : "usr-dot-inactive"}`} />
                      </div>
                      <div className="usr-info">
                        <div className="usr-info-top">
                          <strong className="usr-name">{user.name}</strong>
                          {user.isBatchTop ? (
                            <span className="usr-top-badge">
                              <Crown size={11} /> {user.moduleSpecialization || "Batch Top"}
                            </span>
                          ) : null}
                        </div>
                        <p className="usr-meta">{user.email}</p>
                        <p className="usr-meta">
                          Year {user.academicYear || "-"} • Sem {user.semester || "-"} • {user.batch || "No batch"}
                        </p>
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
                })
              ) : (
                <p className="pp-muted">No students found.</p>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {confirmDelete ? (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3 className="confirm-title">Delete {confirmDelete.type === "module" ? "Module" : "Assignment"}</h3>
            <p className="confirm-msg">
              Are you sure you want to delete <strong>"{confirmDelete.name}"</strong>? This cannot be undone.
            </p>
            <div className="confirm-actions">
              <button type="button" className="confirm-cancel" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
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
