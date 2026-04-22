import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

const channels = [
  {
    title: "General Inquiries",
    detail: "For onboarding, product walkthroughs, or feature guidance.",
    value: "hello@peerpal.app",
  },
  {
    title: "Technical Support",
    detail: "For login issues, bugs, and account-related technical help.",
    value: "support@peerpal.app",
  },
  {
    title: "Campus Collaboration",
    detail: "For institution partnerships and student-program collaboration.",
    value: "collab@peerpal.app",
  },
];

const supportFlow = [
  "Share your issue with clear context.",
  "Our team triages and assigns priority.",
  "You receive updates until resolution.",
];

export default function ContactPage() {
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

      <main className="landing landing-student contact-page">
        <section className="student-shell contact-shell">
          <section className="contact-hero">
            <div className="contact-copy">
              <p className="contact-eyebrow">Contact Us</p>
              <h1>Let’s keep your learning journey moving.</h1>
              <p>
                Whether you need technical help, onboarding guidance, or collaboration support, PeerPal makes it easy to
                reach the right team quickly.
              </p>
            </div>
            <aside className="contact-quick-card" aria-label="Support hours">
              <h3>Support Window</h3>
              <p>Mon - Fri, 9:00 AM - 6:00 PM</p>
              <small>Typical response: within one working day</small>
            </aside>
          </section>

          <section className="contact-grid">
            {channels.map((channel) => (
              <article className="contact-card" key={channel.title}>
                <h3>{channel.title}</h3>
                <p>{channel.detail}</p>
                <a href={`mailto:${channel.value}`}>{channel.value}</a>
              </article>
            ))}
          </section>

          <section className="contact-support-flow">
            <h2>How support works</h2>
            <div className="contact-flow-list">
              {supportFlow.map((step) => (
                <p key={step}>{step}</p>
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
