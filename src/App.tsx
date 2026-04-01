import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EnterRevenuePage from "./pages/EnterRevenuePage";
import MatchBankTransactionsPage from "./pages/MatchBankTransactionsPage";
import PayBillsPage from "./pages/PayBillsPage";
import PayrollPage from "./pages/PayrollPage";
import ReportsPage from "./pages/ReportsPage";
import ShopDetailsPage from "./pages/ShopDetailsPage";
import SettingsPage from "./pages/SettingsPage";

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
            <Route path="/enter-revenue" element={<EnterRevenuePage />} />
            <Route path="/match-transactions" element={<MatchBankTransactionsPage />} />
            <Route path="/pay-bills" element={<PayBillsPage />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/shop-details" element={<ShopDetailsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
