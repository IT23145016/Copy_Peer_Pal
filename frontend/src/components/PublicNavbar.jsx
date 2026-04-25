import { Link, useLocation, useNavigate } from "react-router-dom";
import { Moon, SunMedium } from "lucide-react";
import { clearStoredAuth, getDashboardPathByRole, getStoredAuth } from "../utils/auth";
import siteLogo from "../assets/logo-no-bg.png";

export default function PublicNavbar({ theme = "light", onToggleTheme }) {
  const auth = getStoredAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role = auth?.user?.role || null;
  const isLoggedIn = Boolean(auth?.token);
  const dashboardPath = getDashboardPathByRole(role || "user");
  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Features", href: "/#features" },
    { label: "Help", to: "/help" },
    { label: "Contact Us", to: "/contact" },
    { label: "About Us", to: "/about" },
  ];

  const isActive = (path) => {
    if (!path) return false;
    const [pathname, search = ""] = path.split("?");
    return location.pathname === pathname && location.search === (search ? `?${search}` : "");
  };

  const onLogout = () => {
    clearStoredAuth();
    navigate("/", { replace: true });
  };

  return (
    <header className="student-topbar">
      <Link className="student-brand" to="/">
        <img className="student-brand-logo" src={siteLogo} alt="PeerPal logo" />
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
          <button type="button" className="mini-link student-auth-link" onClick={onLogout}>
            Logout
          </button>
        ) : (
          <Link className="mini-link" to="/login">
            Login
          </Link>
        )}
        <Link className="btn btn-primary student-cta" to="/register">
          Signup
        </Link>
      </div>
    </header>
  );
}
