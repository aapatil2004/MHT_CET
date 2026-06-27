import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

function AdminLogin() {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    // Simple admin password
    if (password === "admin123") {

      // Save auth
      localStorage.setItem("isAdmin", "true");

      navigate("/admin");

    } else {
      alert("Invalid Admin Password");
    }
  };

  return (
    <div className="admin-login-container">

      <div className="admin-login-card">

        <h1>🔐 Admin Login</h1>

        <p>
          Enter administrator password to continue
        </p>

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button onClick={handleLogin}>
          Login
        </button>

      </div>
    </div>
  );
}

export default AdminLogin;