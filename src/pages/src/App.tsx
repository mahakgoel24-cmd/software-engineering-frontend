// src/App.tsx
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";

import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";

// Auth pages
import AuthPage from "./pages/Auth/AuthPage";

// Company pages
import { CompanyDashboard } from "./pages/company/CompanyDashboard";
import CompanyProjects from "./pages/company/CompanyProjects";
import CompanyTrustSafety from "./pages/company/CompanyTrustSafety";
import CompanyNotifications from "./pages/company/CompanyNotifications";
import CompanySettings from "./pages/company/CompanySettings";
import EmployeeInformation from "./pages/company/EmployeeInformation";
import CompanyMessages from "./pages/company/CompanyMessages";

// Developer pages
import { DeveloperDashboard } from "./pages/developer/DeveloperDashboard";
import Earnings from "./pages/developer/Earnings";
import MyApplications from "./pages/developer/MyApplications";
import ExploreProjects from "./pages/developer/ExploreProjects";
import DeveloperVerification from "./pages/developer/DeveloperVerification";
import DeveloperSettings from "./pages/developer/DeveloperSettings";
import Messages from "./pages/developer/Messages";
import Certificates from "./pages/notifications/Certificates";

/* ---------------------------------
   Layout for authenticated dashboards
---------------------------------- */
const DashboardLayout = ({ role }: { role: "company" | "developer" }) => {
  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <Sidebar role={role} />

      <div className="flex-1 flex flex-col md:ml-64">
        <Header />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

/* ---------------------------------
   App Router
---------------------------------- */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />

        {/* ================= COMPANY ROUTES ================= */}
        <Route
          path="/company"
          element={<DashboardLayout role="company" />}
        >
          <Route index element={<CompanyDashboard />} />
          <Route path="projects" element={<CompanyProjects />} />
          <Route path="employee-information" element={<EmployeeInformation />} />
          <Route path="messages" element={<CompanyMessages />} />
          <Route path="trust-safety" element={<CompanyTrustSafety />} />
          <Route path="notifications" element={<CompanyNotifications />} />
          <Route path="settings" element={<CompanySettings />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/company" replace />} />
        </Route>

        {/* ================= DEVELOPER ROUTES ================= */}
        <Route
          path="/developer"
          element={<DashboardLayout role="developer" />}
        >
          <Route index element={<DeveloperDashboard />} />
          <Route path="explore-projects" element={<ExploreProjects />} />
          <Route path="my-applications" element={<MyApplications />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="verify" element={<DeveloperVerification />} />
          <Route path="messages" element={<Messages />} />
          <Route path="notifications/certificates" element={<Certificates />} />
          <Route path="settings" element={<DeveloperSettings />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/developer" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;