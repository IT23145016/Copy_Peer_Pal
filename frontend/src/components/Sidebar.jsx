import { BookOpenCheck, CalendarDays, ChevronLeft, ChevronRight, CircleHelp, LayoutDashboard, LogOut, Moon, SunMedium, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getDashboardPathByRole, getStoredAuth } from "../utils/auth";

export default function Sidebar({ profile, onLogout, onHomeClick }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "true");
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.body.classList.toggle("theme-dark", next);
  };
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
        <span className="pp-sidebar-brand-mark">P</span>
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
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
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
          <LayoutDashboard size={18} />
          {!collapsed && <span>Dashboard</span>}
        </button>
        <Link to="/profile" className={`pp-nav-item ${isActive("/profile") ? "active" : ""}`} title="Profile">
          <UserRound size={18} />
          {!collapsed && <span>Profile</span>}
        </Link>
        {role === "user" ? (
          <>
            <Link to="/helpdesk" className={`pp-nav-item ${isActive("/helpdesk") ? "active" : ""}`} title="Help Desk">
              <CircleHelp size={18} />
              {!collapsed && <span>Help Desk</span>}
            </Link>
            <Link to="/study-sessions" className={`pp-nav-item ${isActive("/study-sessions") ? "active" : ""}`} title="Study Sessions">
              <CalendarDays size={18} />
              {!collapsed && <span>Study Sessions</span>}
            </Link>
            <Link to="/calendar" className={`pp-nav-item ${isActive("/calendar") ? "active" : ""}`} title="Calendar">
              <CalendarDays size={18} />
              {!collapsed && <span>Calendar</span>}
            </Link>
            <Link to="/dashboard?tab=modules" className={`pp-nav-item ${isActive("/dashboard", "modules") ? "active" : ""}`} title="Modules">
              <BookOpenCheck size={18} />
              {!collapsed && <span>Modules</span>}
            </Link>
            <Link to="/dashboard?tab=tracker" className={`pp-nav-item ${isActive("/dashboard", "tracker") ? "active" : ""}`} title="Assignment Tracker">
              <BookOpenCheck size={18} />
              {!collapsed && <span>Assignment Tracker</span>}
            </Link>
          </>
        ) : (
          <>
            <Link to="/admin/dashboard?tab=assignments" className={`pp-nav-item ${isActive("/admin/dashboard", "assignments") ? "active" : ""}`} title="Assignments">
              <BookOpenCheck size={18} />
              {!collapsed && <span>Assignments</span>}
            </Link>
            <Link to="/admin/dashboard?tab=modules" className={`pp-nav-item ${isActive("/admin/dashboard", "modules") ? "active" : ""}`} title="Modules">
              <BookOpenCheck size={18} />
              {!collapsed && <span>Modules</span>}
            </Link>
            <Link to="/admin/dashboard?tab=users" className={`pp-nav-item ${isActive("/admin/dashboard", "users") ? "active" : ""}`} title="Users">
              <UserRound size={18} />
              {!collapsed && <span>Users</span>}
            </Link>
            <Link to="/helpdesk" className={`pp-nav-item ${isActive("/helpdesk") ? "active" : ""}`} title="Help Desk">
              <CircleHelp size={18} />
              {!collapsed && <span>Help Desk</span>}
            </Link>
            <Link to="/study-sessions" className={`pp-nav-item ${isActive("/study-sessions") ? "active" : ""}`} title="Study Sessions">
              <CalendarDays size={18} />
              {!collapsed && <span>Study Sessions</span>}
            </Link>
            <Link to="/calendar" className={`pp-nav-item ${isActive("/calendar") ? "active" : ""}`} title="Calendar">
              <CalendarDays size={18} />
              {!collapsed && <span>Calendar</span>}
            </Link>
          </>
        )}
        <button type="button" className="pp-nav-item pp-nav-logout" onClick={onLogout} title="Logout">
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
        <button type="button" className="pp-nav-item pp-nav-theme" onClick={toggleTheme} title="Toggle theme">
          {dark ? <SunMedium size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{dark ? "Light Mode" : "Dark Mode"}</span>}
        </button>
      </nav>

    </aside>
  );
}
