import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

const highlights = [
  {
    title: "Student-first workflows",
    text: "Everything is designed around day-to-day campus needs: deadlines, sessions, modules, and support.",
  },
  {
    title: "Less switching, more focus",
    text: "PeerPal keeps essential academic tools in one calm interface so students spend less time jumping between apps.",
  },
  {
    title: "Connected support loop",
    text: "Students, mentors, and admins stay aligned through shared updates, requests, and follow-ups in one place.",
  },
];

const stats = [
  { label: "Core Hubs", value: "4", note: "Assignments, Modules, Sessions, Help Desk" },
  { label: "Primary Goal", value: "1", note: "Reduce academic friction every week" },
  { label: "Design Focus", value: "100%", note: "Clarity, speed, and student confidence" },
];

const values = [
  "Clarity over clutter",
  "Consistency across roles",
  "Actionable information first",
  "Support that feels responsive",
];

export default function AboutPage() {
  const navigate = useNavigate();
  const auth = getStoredAuth();

  const onLogout = () => {
    clearStoredAuth();
    navigate("/", { replace: true });
  };

  return (
    <div className={`landing-home-wrap ${auth?.token ? "landing-home-wrap-with-sidebar" : ""}`}>
      {auth?.token ? (
        <div className="landing-sidebar-dock">
          <Sidebar profile={auth.user} onLogout={onLogout} defaultCollapsed />
        </div>
      ) : null}

      <main className="landing landing-student about-page">
        <section className="student-shell about-shell">
          <section className="about-hero">
            <div className="about-copy">
              <p className="about-eyebrow">About Us</p>
              <h1>A modern student workspace built for real campus life.</h1>
              <p>
                PeerPal brings assignments, modules, study sessions, and support into one connected platform so students can
                focus more on learning and less on scattered information.
              </p>
            </div>
            <div className="about-stats" aria-label="PeerPal platform highlights">
              {stats.map((item) => (
                <article className="about-stat-card" key={item.label}>
                  <p className="about-stat-value">{item.value}</p>
                  <p className="about-stat-label">{item.label}</p>
                  <p className="about-stat-note">{item.note}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="about-highlights">
            {highlights.map((item) => (
              <article className="about-highlight-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </section>

          <section className="about-values">
            <h2>What guides our product decisions</h2>
            <div className="about-values-list">
              {values.map((value) => (
                <p key={value}>{value}</p>
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
