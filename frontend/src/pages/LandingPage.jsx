import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookMarked, CalendarRange, CircleHelp, Menu, Moon, SunMedium, UsersRound } from "lucide-react";

const featureCards = [
  {
    icon: <BookMarked size={18} />,
    title: "Assignment flow",
    text: "Track coursework, deadlines, and progress in one calm workspace.",
  },
  {
    icon: <CalendarRange size={18} />,
    title: "Semester planning",
    text: "See lectures, revision blocks, and due dates without the clutter.",
  },
  {
    icon: <UsersRound size={18} />,
    title: "Peer connection",
    text: "Find classmates, group sessions, and academic help faster.",
  },
  {
    icon: <CircleHelp size={18} />,
    title: "Support desk",
    text: "Ask for help when you need it and keep the full context together.",
  },
];

export default function LandingPage() {
  const [theme, setTheme] = useState("light");

  const themeLabel = useMemo(() => (theme === "light" ? "Switch to dark mode" : "Switch to light mode"), [theme]);

  return (
    <main className={`landing landing-student ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
      <section className="student-shell">
        <header className="student-topbar">
          <Link className="student-brand" to="/">
            <span className="student-brand-mark">P</span>
            <span>
              PeerPal
              <small>Student life, simplified</small>
            </span>
          </Link>

          <div className="student-topbar-spacer" aria-hidden="true" />

          <div className="student-top-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
              aria-label={themeLabel}
            >
              {theme === "light" ? <Moon size={16} /> : <SunMedium size={16} />}
              <span>{theme === "light" ? "Dark" : "Light"}</span>
            </button>
            <Link className="mini-link" to="/login">
              Login
            </Link>
            <Link className="btn btn-primary student-cta" to="/register">
              Get Started
            </Link>
            <button type="button" className="menu-dot" aria-label="Menu preview">
              <Menu size={18} />
            </button>
          </div>
        </header>

        <section className="student-hero">
          <div className="student-copy student-copy-simple">
            <div className="hero-banner-card">
              <img
                className="hero-banner-image"
                src="/graduates.png"
                alt="Illustration of graduating students standing together"
              />
            </div>
          </div>
        </section>

        <section className="student-features-wrap" id="features">
          <div className="student-feature-strip">
            {featureCards.map((item, index) => (
              <article className="student-feature-card" key={item.title}>
                <div className="student-feature-top">
                  <span className="feature-icon student-icon">{item.icon}</span>
                  <span className="feature-number">0{index + 1}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="student-showcase" id="experience">
          <article className="showcase-copy">
            <p className="showcase-label">Why this direction works</p>
            <h2>Less corporate, more campus energy.</h2>
            <p>
              The layout uses soft glass panels, orange highlights, and clearer hierarchy so the product feels made
              for undergraduates instead of a generic admin tool.
            </p>
          </article>

          <article className="showcase-panel">
            <div className="showcase-badge">Light + Dark Ready</div>
            <h3>Designed for long study hours</h3>
            <p>
              High contrast text, focused callouts, and warmer orange accents make the interface feel energetic
              without becoming noisy.
            </p>
          </article>
        </section>
      </section>
    </main>
  );
}
