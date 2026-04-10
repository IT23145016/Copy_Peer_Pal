import { useEffect, useMemo, useState } from "react";
import { BookMarked, CheckCircle2, ClipboardList, Clock3, UserRound, XCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

const getRemainingDays = (deadline) => {
  const end = new Date(deadline);
  const now = new Date();
  const ms = end.setHours(23, 59, 59, 999) - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

const getUrgencyLabel = (item) => {
  if (item.overdue) return "Alert";
  if (item.dueSoon) return "Soon";
  return "Planned";
};

export default function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [modules, setModules] = useState([]);
  const [trackerFilter, setTrackerFilter] = useState("all");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = getStoredAuth();
  const activeSection =
    searchParams.get("tab") === "modules" ? "modules" : searchParams.get("tab") === "tracker" ? "tracker" : "dashboard";

  const loadData = async () => {
    try {
      const [meResponse, userAccessResponse, assignmentsResponse, modulesResponse] = await Promise.all([
        api.get("/auth/me"),
        api.get("/auth/user/dashboard"),
        api.get("/assignments"),
        api.get("/modules"),
      ]);

      setProfile(meResponse.data);
      setAssignments(assignmentsResponse.data);
      setModules(modulesResponse.data);

      if (userAccessResponse.data.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load user dashboard");
    }
  };

  useEffect(() => {
    loadData();
  }, [navigate]);

  const onLogout = () => {
    clearStoredAuth();
    navigate("/");
  };

  const onSetTrackerStatus = async (assignmentId, nextStatus) => {
    try {
      setError("");
      setStatus("");
      await api.patch(`/assignments/${assignmentId}/progress`, { status: nextStatus });
      setStatus("Assignment tracker updated");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update assignment tracker");
    }
  };

  const trackerCards = useMemo(
    () =>
      assignments.map((item) => {
        const remainingDays = getRemainingDays(item.deadline);
        const dueSoon = remainingDays <= 2 && item.trackerStatus !== "done";
        const overdue = remainingDays < 0 && item.trackerStatus !== "done";
        return { ...item, remainingDays, dueSoon, overdue };
      }),
    [assignments]
  );

  const pendingCount = useMemo(
    () => trackerCards.filter((item) => item.trackerStatus !== "done").length,
    [trackerCards]
  );

  const doneCount = useMemo(
    () => trackerCards.filter((item) => item.trackerStatus === "done").length,
    [trackerCards]
  );

  const dueSoonItems = useMemo(
    () =>
      trackerCards
        .filter((item) => item.remainingDays >= 0 && item.remainingDays <= 2 && item.trackerStatus !== "done")
        .sort((a, b) => a.remainingDays - b.remainingDays),
    [trackerCards]
  );

  const filteredTrackerCards = useMemo(() => {
    if (trackerFilter === "soon_due") {
      return trackerCards
        .filter((item) => item.remainingDays >= 0 && item.remainingDays <= 2)
        .sort((a, b) => a.remainingDays - b.remainingDays);
    }
    if (trackerFilter === "newly_published") {
      const now = new Date();
      return trackerCards
        .filter((item) => {
          const publishedDate = new Date(item.publishedDate);
          const diffDays = Math.ceil((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
        })
        .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
    }
    return trackerCards;
  }, [trackerCards, trackerFilter]);

  const nextAssignment =
    dueSoonItems[0] || trackerCards.find((item) => !item.overdue && item.trackerStatus !== "done") || null;

  return (
    <div className="pp-layout">
      <Sidebar profile={profile || auth?.user} onLogout={onLogout} />
      <main className="pp-main">

        <div className="pp-welcome">
          <div>
            <h1 className="pp-welcome-name">Hey, {profile?.name?.split(" ")[0] || auth?.user?.name?.split(" ")[0] || "Student"} 👋</h1>
            <p className="pp-welcome-sub">Here's your academic overview for today.</p>
          </div>
          <div className="pp-stat-pills">
            <span className="pp-pill"><ClipboardList size={14} /> {pendingCount} pending</span>
            <span className="pp-pill pp-pill-green"><CheckCircle2 size={14} /> {doneCount} completed</span>
            <span className="pp-pill pp-pill-soft"><BookMarked size={14} /> {modules.length} modules</span>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {status ? <p className="success">{status}</p> : null}

        {activeSection === "dashboard" ? (
          <div className="adm-dashboard">

            {/* Stat cards */}
            <div className="adm-stats-row">
              <article className="adm-stat-card adm-stat-orange">
                <div className="adm-stat-icon"><ClipboardList size={22} /></div>
                <div>
                  <p className="adm-stat-label">Pending Assignments</p>
                  <p className="adm-stat-num">{pendingCount}</p>
                </div>
              </article>
              <article className="adm-stat-card adm-stat-soft">
                <div className="adm-stat-icon"><CheckCircle2 size={22} /></div>
                <div>
                  <p className="adm-stat-label">Completed</p>
                  <p className="adm-stat-num">{doneCount}</p>
                </div>
              </article>
              <article className="adm-stat-card adm-stat-green">
                <div className="adm-stat-icon"><BookMarked size={22} /></div>
                <div>
                  <p className="adm-stat-label">My Modules</p>
                  <p className="adm-stat-num">{modules.length}</p>
                </div>
              </article>
            </div>

            {/* Main two-column grid */}
            <div className="adm-main-grid">
              {/* Left: Due Soon */}
              <div className="adm-left">
                <div className="adm-section-head">
                  <h3>Due Soon</h3>
                  <button type="button" className="adm-see-all" onClick={() => navigate("/dashboard?tab=tracker")}>See all</button>
                </div>
                <div className="adm-assign-cards">
                  {dueSoonItems.length ? dueSoonItems.slice(0, 4).map((item, i) => (
                    <article key={item._id} className={`adm-assign-card ${i % 2 === 0 ? "adm-assign-orange" : "adm-assign-white"}`}>
                      <div className="adm-assign-top">
                        <p className="adm-assign-code">{item.moduleCode}</p>
                        <span className="adm-assign-clock"><Clock3 size={15} /></span>
                      </div>
                      <h4 className="adm-assign-name">{item.assignmentName}</h4>
                      <div className="adm-assign-meta"><span>⏰ {new Date(item.deadline).toLocaleDateString()}</span></div>
                      <div className="adm-assign-footer">
                        <div className="adm-progress-bar">
                          <div className="adm-progress-fill" style={{ width: `${Math.min(100, Math.round((1 - item.remainingDays / 30) * 100))}%` }} />
                        </div>
                        <span className="adm-days-chip">{item.remainingDays}d left</span>
                      </div>
                    </article>
                  )) : <p className="pp-muted">No assignments due soon. 🎉</p>}
                </div>
              </div>

              {/* Right: Schedule Focus */}
              <div className="adm-right">
                <div className="adm-section-head"><h3>Schedule Focus</h3></div>
                {nextAssignment ? (
                  <div className="adm-module-rows">
                    <div className="adm-module-row">
                      <div className="adm-module-dot" />
                      <div className="adm-module-info">
                        <strong>{nextAssignment.moduleCode} — {nextAssignment.assignmentName}</strong>
                        <span>Deadline {new Date(nextAssignment.deadline).toLocaleDateString()} · {nextAssignment.trackerStatus}</span>
                      </div>
                      <span className="adm-module-badge">{nextAssignment.remainingDays}d left</span>
                    </div>
                  </div>
                ) : <p className="pp-muted">Everything looks clear! 🙌</p>}
              </div>
            </div>

            {/* Full-width: My Assignments */}
            <div className="adm-section-head" style={{marginTop:"0.4rem"}}>
              <h3>My Assignments</h3>
              <button type="button" className="adm-see-all" onClick={() => navigate("/dashboard?tab=tracker")}>See all</button>
            </div>
            <div className="adm-student-list">
              {trackerCards.slice(0, 3).map((item) => (
                <div key={item._id} className="adm-student-row">
                  <div className="adm-student-avatar" style={{borderRadius:"10px"}}>
                    {item.trackerStatus === "done" ? <CheckCircle2 size={16} /> : <ClipboardList size={16} />}
                  </div>
                  <div className="adm-student-info">
                    <strong>{item.moduleCode} — {item.assignmentName}</strong>
                    <span>Deadline: {new Date(item.deadline).toLocaleDateString()}</span>
                  </div>
                  <span className={`adm-status-dot ${item.trackerStatus === "done" ? "adm-dot-active" : item.overdue ? "adm-dot-inactive" : ""}`}>
                    {item.trackerStatus === "done" ? "Done" : item.overdue ? "Overdue" : `${item.remainingDays}d left`}
                  </span>
                </div>
              ))}
              {trackerCards.length === 0 && <p className="pp-muted" style={{padding:"1rem"}}>No assignments yet.</p>}
            </div>
          </div>
        ) : null}

        {activeSection === "tracker" ? (
          <div className="adm-dashboard">
            <div className="aa-view-topbar">
              <div>
                <h2 className="aa-view-title">Assignment Tracker</h2>
                <p className="pp-muted">{trackerCards.length} assignment(s)</p>
              </div>
              <div className="aa-filter-tabs">
                {[["all","All"],["soon_due","Soon Due"],["newly_published","Recently Published"]].map(([val, label]) => (
                  <button key={val} type="button" className={`aa-filter-tab ${trackerFilter === val ? "active" : ""}`} onClick={() => setTrackerFilter(val)}>{label}</button>
                ))}
              </div>
            </div>
            <div className="aa-published-grid">
              {filteredTrackerCards.length ? filteredTrackerCards.map((item) => (
                <article key={item._id} className={`aa-pub-card ${item.overdue ? "aa-pub-overdue" : ""}`}>
                  <div className="aa-pub-top">
                    <span className="aa-pub-code">{item.moduleCode}</span>
                    <span className={`aa-pub-clock ${item.overdue ? "aa-clock-red" : ""}`}><Clock3 size={14} /></span>
                  </div>
                  <h4 className="aa-pub-name">{item.assignmentName}</h4>
                  <div className="aa-pub-dates">
                    <span>📅 {new Date(item.publishedDate).toLocaleDateString()}</span>
                    <span>⏰ {new Date(item.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="aa-pub-footer">
                    <div className="aa-progress-bar">
                      <div className="aa-progress-fill" style={{ width: item.overdue ? "100%" : `${Math.min(100, Math.round((1 - item.remainingDays / 30) * 100))}%` }} />
                    </div>
                    <span className={`aa-days-chip ${item.overdue ? "aa-chip-red" : ""}`}>
                      {item.overdue ? "Overdue" : `${item.remainingDays}d left`}
                    </span>
                  </div>
                  <div style={{marginTop:"0.5rem"}}>
                    {item.trackerStatus === "done" ? (
                      <span className="pp-btn-done" style={{display:"inline-flex",alignItems:"center",gap:"0.3rem",padding:"0.4rem 0.8rem",borderRadius:"10px",fontSize:"0.82rem",opacity:0.85,cursor:"default"}}>
                        <CheckCircle2 size={14} /> Completed
                      </span>
                    ) : (
                      <div style={{display:"flex",gap:"0.4rem"}}>
                        <button type="button" className="pp-btn-done" style={{margin:0,padding:"0.4rem 0.8rem",fontSize:"0.82rem"}} onClick={() => onSetTrackerStatus(item._id, "done")}>
                          <CheckCircle2 size={14} /> Mark Done
                        </button>
                        <button type="button" className="pp-btn-danger" style={{margin:0,padding:"0.4rem 0.8rem",fontSize:"0.82rem"}} onClick={() => onSetTrackerStatus(item._id, "not_completed")}>
                          <XCircle size={14} /> Not Done
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )) : <p className="pp-muted">No assignments match this filter.</p>}
            </div>
          </div>
        ) : null}

        {activeSection === "modules" ? (
          <div className="adm-dashboard">
            <div className="aa-view-topbar">
              <div>
                <h2 className="aa-view-title">My Modules</h2>
                <p className="pp-muted">{modules.length} module(s) enrolled</p>
              </div>
            </div>
            <div className="aa-published-grid">
              {modules.length ? modules.map((item) => (
                <article key={item._id} className="aa-pub-card">
                  <div className="aa-pub-top">
                    <span className="aa-pub-code">{item.moduleCode}</span>
                    <span className="aa-pub-clock"><BookMarked size={14} /></span>
                  </div>
                  <h4 className="aa-pub-name">{item.moduleName}</h4>
                  <div className="aa-pub-dates">
                    <span>Year {item.academicYear}</span>
                    <span>Semester {item.semester}</span>
                  </div>
                </article>
              )) : <p className="pp-muted">No modules available yet.</p>}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
