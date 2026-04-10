import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Moon, SunMedium } from "lucide-react";
import api from "../services/api";
import { getDashboardPathByRole, setStoredAuth } from "../utils/auth";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    academicYear: "1",
    semester: "1",
    batch: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme") || "light";
    document.body.classList.toggle("theme-dark", saved === "dark");
    return saved;
  });
  const navigate = useNavigate();

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.body.classList.toggle("theme-dark", next === "dark");
  };

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const normalizedName = form.name.trim();
    const normalizedEmail = form.email.trim().toLowerCase();
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (normalizedName.length < 2) { setError("Name must be at least 2 characters"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) { setError("Enter a valid email"); return; }
    if (!strongPassword.test(form.password)) { setError("Password needs 8+ chars, uppercase, lowercase, and a number"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (!["1","2","3","4"].includes(String(form.academicYear))) { setError("Select a valid academic year"); return; }
    if (!["1","2"].includes(String(form.semester))) { setError("Select a valid semester"); return; }
    setLoading(true);
    try {
      const payload = { ...form, name: normalizedName, email: normalizedEmail, academicYear: Number(form.academicYear), semester: Number(form.semester), batch: form.batch.trim() };
      const { data } = await api.post("/auth/register", payload);
      setStoredAuth({ token: data.token, user: data.user });
      navigate(getDashboardPathByRole(data.user?.role));
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const EyeOpen = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
      <path d="M2 12s3.64-8 10-8 10 8 10 8-3.64 8-10 8-10-8-10-8z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
  const EyeOff = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
      <path d="M3 3l18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8-1 2.61-2.91 4.77-5.42 6.06" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M6.61 6.61C4.62 7.88 3.11 9.76 2 12c1.73 4.89 6 8 10 8 1.61 0 3.13-.36 4.5-1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );

  return (
    <main className={`landing landing-student reg-page ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
      <section className="student-shell">

        <header className="student-topbar">
          <Link className="student-brand" to="/">
            <span className="student-brand-mark">P</span>
            <span>PeerPal<small>Student life, simplified</small></span>
          </Link>
          <div className="student-topbar-spacer" aria-hidden="true" />
          <div className="student-top-actions">
            <button type="button" className="theme-toggle" onClick={toggleTheme}>
              {theme === "light" ? <Moon size={16} /> : <SunMedium size={16} />}
              <span>{theme === "light" ? "Dark" : "Light"}</span>
            </button>
            <Link className="mini-link" to="/">Home</Link>
          </div>
        </header>

        <div className="reg-center">
          <form className="login-card reg-card" onSubmit={onSubmit} noValidate>

            <div className="login-card-header">
              <span className="login-badge">New Account</span>
              <h1 className="login-title">Create Account</h1>
              <p className="login-subtitle">Join PeerPal — your student ID is auto-generated.</p>
            </div>

            <div className="login-fields">
              <div className="login-field">
                <label htmlFor="reg-name">Full Name</label>
                <input id="reg-name" name="name" value={form.name} onChange={onChange} placeholder="e.g. Akarshi Dev" required />
              </div>

              <div className="login-field">
                <label htmlFor="reg-email">Email</label>
                <input id="reg-email" name="email" type="email" value={form.email} onChange={onChange} placeholder="you@university.ac" required />
              </div>

              <div className="reg-two-col">
                <div className="login-field">
                  <label htmlFor="reg-password">Password</label>
                  <div className="password-field">
                    <input id="reg-password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={onChange} required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword((p) => !p)}>
                      {showPassword ? <EyeOff /> : <EyeOpen />}
                    </button>
                  </div>
                </div>
                <div className="login-field">
                  <label htmlFor="reg-confirm">Confirm Password</label>
                  <div className="password-field">
                    <input id="reg-confirm" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={onChange} required />
                    <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((p) => !p)}>
                      {showConfirmPassword ? <EyeOff /> : <EyeOpen />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="reg-three-col">
                <div className="login-field">
                  <label htmlFor="reg-year">Year</label>
                  <select id="reg-year" name="academicYear" value={form.academicYear} onChange={onChange}>
                    {[1,2,3,4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div className="login-field">
                  <label htmlFor="reg-sem">Semester</label>
                  <select id="reg-sem" name="semester" value={form.semester} onChange={onChange}>
                    <option value="1">Sem 1</option>
                    <option value="2">Sem 2</option>
                  </select>
                </div>
                <div className="login-field">
                  <label htmlFor="reg-batch">Batch</label>
                  <input id="reg-batch" name="batch" value={form.batch} onChange={onChange} placeholder="2024-CS-A" />
                </div>
              </div>
            </div>

            {error ? <p className="error" style={{ marginTop: "0.4rem" }}>{error}</p> : null}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <p className="login-footer-text">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>

          </form>
        </div>

      </section>
    </main>
  );
}
