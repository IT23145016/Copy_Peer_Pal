import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AddAssignmentPage from "./pages/AddAssignmentPage";
import AddModulePage from "./pages/AddModulePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AboutPage from "./pages/AboutPage";
import CalendarPage from "./pages/CalendarPage";
import AppFooter from "./components/AppFooter";
import SystemGuideChatbot from "./components/SystemGuideChatbot";
import SeasonalOverlay from "./components/SeasonalOverlay";
import ContactPage from "./pages/ContactPage";
import PublicNavbar from "./components/PublicNavbar";
import DashboardPage from "./pages/DashboardPage";
import HelpPage from "./pages/HelpPage";
import HelpDeskPage from "./pages/HelpDeskPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import StudySessionsPage from "./pages/StudySessionsPage";
import StudySessionsProposePage from "./pages/StudySessionsProposePage";
import StudySessionsRequestPage from "./pages/StudySessionsRequestPage";
import { getDashboardPathByRole, getStoredAuth } from "./utils/auth";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const auth = getStoredAuth();
  if (!auth?.token) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(auth.user?.role)) {
    return <Navigate to={getDashboardPathByRole(auth.user?.role)} replace />;
  }
  return children;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.body.classList.toggle("theme-dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <>
      <SeasonalOverlay />
      <div className="app-navbar-wrap">
        <div className="app-navbar-shell">
          <PublicNavbar theme={theme} onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))} />
        </div>
      </div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/helpdesk"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <HelpDeskPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-sessions"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <StudySessionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-sessions/propose"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <StudySessionsProposePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-sessions/request"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <StudySessionsRequestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assignments/add"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AddAssignmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/modules/add"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AddModulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SystemGuideChatbot />
      <AppFooter />
    </>
  );
}
