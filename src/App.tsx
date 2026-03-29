import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

function RequireAuth() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* All authenticated routes */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* Placeholder routes for sidebar links */}
            <Route path="/enter-revenue" element={<Placeholder title="Enter Revenue" />} />
            <Route path="/match-transactions" element={<Placeholder title="Match Bank Transactions" />} />
            <Route path="/pay-bills" element={<Placeholder title="Pay Bills" />} />
            <Route path="/payroll" element={<Placeholder title="Enter Payroll & Adjustments" />} />
            <Route path="/reports" element={<Placeholder title="Reports" />} />
            <Route path="/shop-details" element={<Placeholder title="Shop Details" />} />
            <Route path="/settings" element={<Placeholder title="Settings" />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
      <p className="mt-2 text-slate-400">This page will be built out later.</p>
    </div>
  );
}
