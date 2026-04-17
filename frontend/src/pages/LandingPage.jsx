import { useNavigate } from "react-router-dom";
import { BookMarked, CalendarRange, CircleHelp, UsersRound } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

const stats = [
  { value: "100K+", label: "Student plans organised" },
  { value: "1K+", label: "Campus support requests guided" },
  { value: "100+", label: "Study groups coordinated" },
];

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

      <main className="landing landing-student peerpal-home">
        <section className="peerpal-home-shell">
          <div className="peerpal-home-topbar">
            <p>Join PeerPal and build a calmer, smarter student routine. Register now to get started.</p>
          </div>

          <section className="peerpal-home-hero">
            <div className="peerpal-home-copy">
              <span className="peerpal-home-kicker">Student life, simplified</span>
              <h1>Knowledge, support, and planning for every student, everywhere.</h1>
              <p className="peerpal-home-subtitle">
                Accessible academic coordination for campus life. Keep deadlines, study sessions, and peer help in one
                friendly place.
              </p>

              <div className="peerpal-home-actions">
                <button type="button" className="peerpal-home-primary" onClick={() => navigate(auth?.token ? "/dashboard" : "/register")}>
                  Get Started
                </button>
                <button type="button" className="peerpal-home-secondary" onClick={() => navigate("/about")}>
                  Learn More
                </button>
              </div>
            </div>

            <div className="peerpal-home-visual">
              <div className="peerpal-home-accent peerpal-home-accent-top" aria-hidden="true" />
              <div className="peerpal-home-accent peerpal-home-accent-bottom" aria-hidden="true" />
              <div className="peerpal-home-doodle peerpal-home-doodle-left" aria-hidden="true" />
              <div className="peerpal-home-doodle peerpal-home-doodle-bottom" aria-hidden="true" />
              <div className="peerpal-home-spark peerpal-home-spark-one" aria-hidden="true" />
              <div className="peerpal-home-spark peerpal-home-spark-two" aria-hidden="true" />
              <div className="peerpal-home-spark peerpal-home-spark-three" aria-hidden="true" />
              <img
                className="peerpal-home-image"
                src="/student-realistic.png"
                alt="Student holding books and smiling"
              />
            </div>

            <div className="peerpal-home-stats">
              {stats.map((item) => (
                <article key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="peerpal-home-feature-band" id="features">
            {featureCards.map((item) => (
              <article className="peerpal-home-feature-card" key={item.title}>
                <span className="peerpal-home-feature-icon">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </section>

          <section className="peerpal-home-info-grid" id="experience">
            <article className="peerpal-home-info-card">
              <span className="peerpal-home-info-label">Why PeerPal works</span>
              <h2>Made for real campus routines, not just admin tasks.</h2>
              <p>
                From assignment tracking to study sessions and help requests, PeerPal keeps everything in one focused
                system that feels approachable for students.
              </p>
            </article>

            <article className="peerpal-home-info-card peerpal-home-info-card-highlight">
              <span className="peerpal-home-info-label">Built around students</span>
              <h2>Clearer planning. Faster support. Better collaboration.</h2>
              <p>
                Use one platform to organise modules, coordinate classmates, and stay ahead of deadlines without the
                noise of disconnected tools.
              </p>
            </article>
          </section>
        </section>
      </main>
    </div>
  );
}
