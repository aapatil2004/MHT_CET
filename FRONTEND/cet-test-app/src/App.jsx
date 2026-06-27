import AdminPage from "./pages/AdminPage";
import TestPage from "./pages/TestPage";
import Result from "./pages/ResultPage";
import Dashboard from "./pages/DashboardPage";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
function App() {

  const ProtectedAdminRoute = ({ children }) => {
    const isAdmin =
      localStorage.getItem("isAdmin");

    return isAdmin === "true"
      ? children
      : <Navigate to="/admin-login" />;
  };
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TestPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/result" element={<Result />} />
        <Route path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminPage />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/admin-login" element={<AdminLogin />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;