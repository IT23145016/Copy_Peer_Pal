import { Link, useLocation } from "react-router-dom";

export default function AppFooter() {
  const location = useLocation();
  const year = new Date().getFullYear();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <strong>PeerPal</strong>
          <p>
            {isAdmin
              ? "Manage student support, assignments, and collaboration from one place."
              : "A smarter campus companion for assignments, support, and study collaboration."}
          </p>
        </div>

        <div className="site-footer-links">
          <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"}>Dashboard</Link>
          <Link to="/helpdesk">Help Desk</Link>
          <Link to="/study-sessions">Study Sessions</Link>
          <Link to="/calendar">Calendar</Link>
        </div>

        <div className="site-footer-meta">
          <span>Built for student life</span>
          <span>© {year} PeerPal</span>
        </div>
      </div>
    </footer>
  );
}
