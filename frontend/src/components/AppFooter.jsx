import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";
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
  const supportHubPath = isLoggedInArea ? "/helpdesk" : "/help";
  const contactPath = isLoggedInArea ? "/helpdesk" : "/contact";

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

  const supportLinks = [
    { label: "Help Center", to: supportHubPath },
    { label: "Contact Support", to: contactPath },
    { label: "About PeerPal", to: "/about" },
    { label: "Campus Features", to: "/#features", href: true },
  ];

  const socialLinks = [
    { label: "Twitter", href: "#", icon: Twitter },
    { label: "Instagram", href: "#", icon: Instagram },
    { label: "Facebook", href: "#", icon: Facebook },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer-content">
        <div className="site-footer-shell">
          <div className="site-footer-links-grid">
            <div className="site-footer-column">
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
              <div className="site-footer-list">
                {supportLinks.map((item) =>
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

            <div className="site-footer-column site-footer-column-contact">
              <div className="site-footer-contact">
                <p>
                  <Mail size={18} />
                  <span>support@peerpal.app</span>
                </p>
                <p>
                  <Phone size={18} />
                  <span>+94 11 234 5678</span>
                </p>
                <p className="site-footer-address">
                  <MapPin size={18} />
                  <span>PeerPal Campus Hub, Colombo, Sri Lanka</span>
                </p>
              </div>
            </div>
          </div>

          <div className="site-footer-lower">
            <div className="site-footer-lower-inner">
              <div className="site-footer-lower-contact">
                <div className="site-footer-socials" aria-label="PeerPal social media links">
                  {socialLinks.map(({ label, href, icon: Icon }) => (
                    <a key={label} href={href} aria-label={label}>
                      <Icon size={18} />
                    </a>
                  ))}
                </div>
              </div>

              <div className="site-footer-lower-subscribe">
                <form className="site-footer-subscribe-form">
                  <label className="site-footer-subscribe-label" htmlFor="footer-subscribe-email">
                    Email subscription
                  </label>
                  <div className="site-footer-subscribe-row">
                    <input
                      id="footer-subscribe-email"
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                    />
                    <button type="submit">Subscribe</button>
                  </div>
                </form>
              </div>
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
