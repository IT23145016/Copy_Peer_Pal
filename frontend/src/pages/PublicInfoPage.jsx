import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { clearStoredAuth, getStoredAuth } from "../utils/auth";

export default function PublicInfoPage({ eyebrow, title, description, highlights = [] }) {
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

      <main className="landing landing-student">
        <section className="student-shell">
          <section className="public-info-hero">
            <div className="public-info-copy">
              <p className="public-info-eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          </section>

          <section className="public-info-grid">
            {highlights.map((item) => (
              <article className="public-info-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </section>
        </section>
      </main>
    </div>
  );
}
