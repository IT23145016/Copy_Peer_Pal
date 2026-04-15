import { Link, useLocation, useNavigate } from "react-router-dom";
import { Moon, SunMedium } from "lucide-react";
import { clearStoredAuth, getDashboardPathByRole, getStoredAuth } from "../utils/auth";
import peerPalLogo from "../assets/peerpal-logo.svg";

export default function PublicNavbar({ theme = "light", onToggleTheme }) {
  const auth = getStoredAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role = auth?.user?.role || null;
  const isLoggedIn = Boolean(auth?.token);
  const dashboardPath = getDashboardPathByRole(role || "user");
  const brandPath = isLoggedIn ? dashboardPath : "/";

  const navLinks = isLoggedIn
    ? role === "admin"
      ? [
          { label: "Dashboard", to: "/admin/dashboard" },
          { label: "Assignments", to: "/admin/dashboard?tab=assignments" },
          { label: "Modules", to: "/admin/dashboard?tab=modules" },
          { label: "Users", to: "/admin/dashboard?tab=users" },
        ]
      : [
          { label: "Dashboard", to: "/dashboard" },
          { label: "Profile", to: "/profile" },
          { label: "Calendar", to: "/calendar" },
          { label: "Tracker", to: "/dashboard?tab=tracker" },
        ]
    : [
        { label: "Home", to: "/" },
        { label: "Features", href: "/#features" },
        { label: "Experience", href: "/#experience" },
        { label: "Join", to: "/register" },
      ];

  const onLogout = () => {
    clearStoredAuth();
    navigate("/", { replace: true });
  };

  const isActive = (path) => {
    if (!path) return false;
    const [pathname, search = ""] = path.split("?");
    return location.pathname === pathname && location.search === (search ? `?${search}` : "");
  };

  return (
    <header className="student-topbar">
      <Link className="student-brand" to={brandPath}>
        <img className="student-brand-logo" src={peerPalLogo} alt="PeerPal logo" />
      </Link>

      <nav className="student-nav" aria-label="Main navigation">
        {navLinks.map((item) =>
          item.href ? (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ) : (
            <Link key={item.label} className={isActive(item.to) ? "is-active" : ""} to={item.to}>
              {item.label}
            </Link>
          )
        )}
      </nav>

      <div className="student-top-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <Moon size={16} /> : <SunMedium size={16} />}
          <span>{theme === "light" ? "Dark" : "Light"}</span>
        </button>
        {isLoggedIn ? (
          <>
            <Link className="mini-link" to={dashboardPath}>
              {auth?.user?.name?.split(" ")[0] || "Account"}
            </Link>
            <button type="button" className="btn btn-primary student-cta student-logout-btn" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="mini-link" to="/login">
              Login
            </Link>
            <Link className="btn btn-primary student-cta" to="/register">
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
