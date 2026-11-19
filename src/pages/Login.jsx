
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, Mail, Lock, Eye, EyeOff } from "lucide-react";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Please enter your email and password.");
      return;
    }

    // Demo login only; authentication will be added later.
    navigate("/dashboard");
  }

  return (
    <div className="login-page">
      <div className="login-overlay">
        <div className="login-brand">
          <Plane size={38} />
          <h1>AeroOps</h1>
          <p>Aircraft Ground Operations & Maintenance System</p>
        </div>

        <div className="login-card">
          <h2>Welcome Back</h2>
          <p>Sign in to access your operations dashboard</p>

          <form onSubmit={handleLogin}>
            <label>Email Address</label>
            <div className="input-group">
              <Mail size={19} />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <label>Password</label>
            <div className="input-group">
              <Lock size={19} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input type="checkbox" />
                Remember me
              </label>
              <span>Demo Login</span>
            </div>

            <button type="submit" className="login-button">
              Sign In
            </button>
          </form>
        </div>

        <p className="login-footer">
          © 2026 AeroOps. Aircraft Operations Management System.
        </p>
      </div>
    </div>
  );
}

export default Login;
