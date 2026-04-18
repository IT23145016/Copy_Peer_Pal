import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpenCheck, ShieldCheck } from "lucide-react";
import api from "../services/api";
import { getDashboardPathByRole, setStoredAuth } from "../utils/auth";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid email");
      return;
    }
    if (!form.password) {
      setError("Password is required");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { ...form, email: normalizedEmail });
      setStoredAuth({ token: data.token, user: data.user });
      navigate(getDashboardPathByRole(data.user?.role));
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="landing landing-student">
      <section className="student-shell login-shell">
        <div className="login-center">
          <aside className="login-visual" aria-hidden="true">
            <span className="login-visual-kicker">Student Login</span>
            <h2 className="login-visual-heading">Plan better, study calmer, and stay connected.</h2>
            <p className="login-visual-sub">
              Access assignments, modules, study sessions, and support tools in one modern workspace.
            </p>

            <div className="login-visual-highlights">
              <div className="login-highlight-card">
                <span className="login-highlight-icon">
                  <BookOpenCheck size={18} />
                </span>
                <div>
                  <strong>Assignments</strong>
                  <small>Track deadlines clearly</small>
                </div>
              </div>
              <div className="login-highlight-card">
                <span className="login-highlight-icon">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <strong>Help Desk</strong>
                  <small>Reach support faster</small>
                </div>
              </div>
            </div>
          </aside>

          <form className="login-card" onSubmit={onSubmit} noValidate>
            <div className="login-card-header">
              <span className="login-badge">Welcome Back</span>
              <h1 className="login-title">Sign in to PeerPal</h1>
              <p className="login-subtitle">Use your admin or student account.</p>
            </div>

            <div className="login-fields">
              <div className="login-field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" value={form.email} onChange={onChange} />
              </div>

              <div className="login-field">
                <label htmlFor="password">Password</label>
                <div className="password-field">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={onChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 3l18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8-1 2.61-2.91 4.77-5.42 6.06" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        <path d="M6.61 6.61C4.62 7.88 3.11 9.76 2 12c1.73 4.89 6 8 10 8 1.61 0 3.13-.36 4.5-1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2 12s3.64-8 10-8 10 8 10 8-3.64 8-10 8-10-8-10-8z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error ? <p className="error">{error}</p> : null}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="login-footer-text">
              No account? <Link to="/register">Sign up</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
