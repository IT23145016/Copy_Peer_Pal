import { BookOpenCheck, CalendarDays, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, LayoutDashboard, Presentation, UserRound, UsersRound } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getDashboardPathByRole, getStoredAuth } from "../utils/auth";
import siteLogo from "../assets/logo.png";

export default function Sidebar({ profile, onHomeClick, defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === null ? defaultCollapsed : saved === "true";
  });
  const navigate = useNavigate();
  const location = useLocation();
  const storedAuth = getStoredAuth();
  const role = profile?.role || storedAuth?.user?.role || "user";
  const avatarSrc = profile?.avatar || "";
  const initials = (profile?.name || "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  const onHomeNavigate = () => {
    if (onHomeClick) { onHomeClick(); return; }
    navigate(storedAuth?.token ? getDashboardPathByRole(role) : "/");
  };

  const isActive = (path, tab) => {
    if (tab) return location.pathname === path && new URLSearchParams(location.search).get("tab") === tab;
    return location.pathname === path && !new URLSearchParams(location.search).get("tab");
  };

  return (
    <aside className={`pp-sidebar ${collapsed ? "pp-sidebar-collapsed" : ""}`}>
      <div className="pp-sidebar-brand">
        <img className="pp-sidebar-brand-logo" src={siteLogo} alt="PeerPal logo" />
        {!collapsed && (
          <span className="pp-sidebar-brand-text">
            PeerPal
            <small>Student life, simplified</small>
          </span>
        )}
        <button
          type="button"
          className="pp-sidebar-toggle"
          onClick={() => { const next = !collapsed; localStorage.setItem("sidebar-collapsed", String(next)); setCollapsed(next); }}
          aria-label="Toggle sidebar"
          style={{ position: "relative", right: "auto", bottom: "auto", marginLeft: "auto" }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {!collapsed && (
        <div className="pp-sidebar-profile">
          {avatarSrc
            ? <img className="pp-avatar-img" src={avatarSrc} alt="Profile" />
            : <div className="pp-avatar-fallback">{initials}</div>
          }
          <div>
            <p className="pp-sidebar-name">{profile?.name || "User"}</p>
            <p className="pp-sidebar-role">{profile?.role || "member"}</p>
          </div>
        </div>
      )}

      {collapsed && avatarSrc && (
        <div className="pp-sidebar-avatar-mini">
          <img className="pp-avatar-img" src={avatarSrc} alt="Profile" />
        </div>
      )}

      <nav className="pp-sidebar-nav">
        <button type="button" className={`pp-nav-item ${isActive("/dashboard") || isActive("/admin/dashboard") ? "active" : ""}`} onClick={onHomeNavigate} title="Dashboard">
          <LayoutDashboard size={21} />
          {!collapsed && <span>Dashboard</span>}
        </button>
        {role === "user" ? (
          <>
            <Link to="/helpdesk" className={`pp-nav-item ${isActive("/helpdesk") ? "active" : ""}`} title="Help Desk">
              <CircleHelp size={21} />
              {!collapsed && <span>Help Desk</span>}
            </Link>
            <Link to="/study-sessions" className={`pp-nav-item ${isActive("/study-sessions") ? "active" : ""}`} title="Study Sessions">
              <Presentation size={21} />
              {!collapsed && <span>Study Sessions</span>}
            </Link>
            <Link to="/calendar" className={`pp-nav-item ${isActive("/calendar") ? "active" : ""}`} title="Calendar">
              <CalendarDays size={21} />
              {!collapsed && <span>Calendar</span>}
            </Link>
            <Link to="/dashboard?tab=modules" className={`pp-nav-item ${isActive("/dashboard", "modules") ? "active" : ""}`} title="Modules">
              <BookOpenCheck size={21} />
              {!collapsed && <span>Modules</span>}
            </Link>
            <Link to="/dashboard?tab=tracker" className={`pp-nav-item ${isActive("/dashboard", "tracker") ? "active" : ""}`} title="Assignment Tracker">
              <ClipboardList size={21} />
              {!collapsed && <span>Assignment Tracker</span>}
            </Link>
            <Link to="/profile" className={`pp-nav-item ${isActive("/profile") ? "active" : ""}`} title="Profile">
              <UserRound size={21} />
              {!collapsed && <span>Profile</span>}
            </Link>
          </>
        ) : (
          <>
            <Link to="/admin/dashboard?tab=assignments" className={`pp-nav-item ${isActive("/admin/dashboard", "assignments") ? "active" : ""}`} title="Assignments">
              <ClipboardList size={21} />
              {!collapsed && <span>Assignments</span>}
            </Link>
            <Link to="/admin/dashboard?tab=modules" className={`pp-nav-item ${isActive("/admin/dashboard", "modules") ? "active" : ""}`} title="Modules">
              <BookOpenCheck size={21} />
              {!collapsed && <span>Modules</span>}
            </Link>
            <Link to="/admin/dashboard?tab=users" className={`pp-nav-item ${isActive("/admin/dashboard", "users") ? "active" : ""}`} title="Users">
              <UsersRound size={21} />
              {!collapsed && <span>Users</span>}
            </Link>
            <Link to="/helpdesk" className={`pp-nav-item ${isActive("/helpdesk") ? "active" : ""}`} title="Help Desk">
              <CircleHelp size={21} />
              {!collapsed && <span>Help Desk</span>}
            </Link>
            <Link to="/study-sessions" className={`pp-nav-item ${isActive("/study-sessions") ? "active" : ""}`} title="Study Sessions">
              <Presentation size={21} />
              {!collapsed && <span>Study Sessions</span>}
            </Link>
            <Link to="/calendar" className={`pp-nav-item ${isActive("/calendar") ? "active" : ""}`} title="Calendar">
              <CalendarDays size={21} />
              {!collapsed && <span>Calendar</span>}
            </Link>
            <Link to="/profile" className={`pp-nav-item ${isActive("/profile") ? "active" : ""}`} title="Profile">
              <UserRound size={21} />
              {!collapsed && <span>Profile</span>}
            </Link>
          </>
        )}
      </nav>

    </aside>
  );
}
