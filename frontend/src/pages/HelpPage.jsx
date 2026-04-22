import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

const topics = [
  {
    title: "Account & Access",
    text: "Troubleshoot sign-in, password visibility, and role-based dashboard routing.",
  },
  {
    title: "Assignments & Modules",
    text: "Understand publish flow, deadlines, submission tracking, and module organization.",
  },
  {
    title: "Study Sessions",
    text: "Get help with proposing sessions, requests, scheduling, and follow-up workflow.",
  },
];

const quickActions = [
  "Check dashboard notifications first.",
  "Open Help Desk for direct support tickets.",
  "Share screenshots and exact steps for faster fixes.",
];

export default function HelpPage() {
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

      <main className="landing landing-student help-page">
        <section className="student-shell help-shell">
          <section className="help-hero-modern">
            <div className="help-copy-modern">
              <p className="help-eyebrow-modern">Help</p>
              <h1>Support that is clear, fast, and student-friendly.</h1>
              <p>
                PeerPal keeps academic help simple for students and admins, with clear paths for issue reporting,
                task guidance, and follow-up updates.
              </p>
            </div>
            <aside className="help-quick-card-modern">
              <h3>Need urgent help?</h3>
              <p>Use the in-app Help Desk after sign in.</p>
              <small>Track request status in one place.</small>
            </aside>
          </section>

          <section className="help-topic-grid-modern">
            {topics.map((item) => (
              <article className="help-topic-card-modern" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </section>

          <section className="help-actions-modern">
            <h2>Quick steps before contacting support</h2>
            <div className="help-actions-list-modern">
              {quickActions.map((step) => (
                <p key={step}>{step}</p>
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
