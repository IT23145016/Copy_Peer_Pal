import { Mail, MapPin, Phone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function AppFooter() {
  const location = useLocation();
  const year = new Date().getFullYear();
  const isAdmin = location.pathname.startsWith("/admin");
  const isLoggedInArea =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/profile") ||
    location.pathname.startsWith("/helpdesk") ||
    location.pathname.startsWith("/study-sessions") ||
    location.pathname.startsWith("/calendar");

  const navigationLinks = [
    { label: "Home", to: "/" },
    { label: "Features", to: "/#features", href: true },
    { label: "Help", to: "/help" },
    { label: "Contact Us", to: "/contact" },
    { label: "About Us", to: "/about" },
  ];

  const platformLinks = isLoggedInArea
    ? [
        { label: isAdmin ? "Admin Dashboard" : "Dashboard", to: isAdmin ? "/admin/dashboard" : "/dashboard" },
        { label: "Help Desk", to: "/helpdesk" },
        { label: "Study Sessions", to: "/study-sessions" },
        { label: "Calendar", to: "/calendar" },
      ]
    : [
        { label: "Student Planning", to: "/" },
        { label: "Assignment Tracking", to: "/#features", href: true },
        { label: "Peer Support", to: "/help" },
        { label: "Campus Collaboration", to: "/about" },
      ];

  return (
    <footer className="site-footer">
      <div className="site-footer-content">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <span className="site-footer-kicker">PeerPal</span>
            <strong>Keep student life clearer, calmer, and more connected.</strong>
            <p>
              {isAdmin
                ? "Manage assignments, modules, support, and collaboration from one modern academic workspace."
                : "PeerPal brings deadlines, support, and study coordination into one place for a smoother campus experience."}
            </p>
          </div>

          <div className="site-footer-column">
            <h4>Navigation</h4>
            <div className="site-footer-list">
              {navigationLinks.map((item) =>
                item.href ? (
                  <a key={item.label} href={item.to}>
                    {item.label}
                  </a>
                ) : (
                  <Link key={item.label} to={item.to}>
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </div>

          <div className="site-footer-column">
            <h4>Platform</h4>
            <div className="site-footer-list">
              {platformLinks.map((item) =>
                item.href ? (
                  <a key={item.label} href={item.to}>
                    {item.label}
                  </a>
                ) : (
                  <Link key={item.label} to={item.to}>
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </div>

          <div className="site-footer-column">
            <h4>Get in touch</h4>
            <div className="site-footer-contact">
              <p>
                <Mail size={16} />
                <span>support@peerpal.app</span>
              </p>
              <p>
                <Phone size={16} />
                <span>+94 11 234 5678</span>
              </p>
              <p className="site-footer-address">
                <MapPin size={16} />
                <span>PeerPal Campus Hub, Colombo, Sri Lanka</span>
              </p>
            </div>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p>Copyright © {year} PeerPal. All rights reserved.</p>
          <div className="site-footer-bottom-meta">
            <span>Built for student life</span>
            <span>Made for modern campus workflows</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
