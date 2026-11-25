
import "./App.css";
import Home from "./Home";
import { downloadReport } from "./downloadReport";

import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  NavLink,
  Outlet,
  useNavigate,
  useParams,
  useLocation
} from "react-router-dom";

import axios from "axios";

import {
  Activity,
  LayoutDashboard,
  ScanLine,
  History,
  UserRound,
  LogOut,
  Menu,
  X,
  Search,
  UploadCloud,
  Image as ImageIcon,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowRight,
  FileImage,
  Microscope,
  HeartPulse,
  Eye,
  Trash2,
  RefreshCw,
  Lock,
  Mail,
  CalendarDays,
  ChevronRight,
  Download,
  Info,
  ChartNoAxesCombined
} from "lucide-react";

const API =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API,
  timeout: 120000
});

const CLASS_NAMES = {
  MEL: "Melanoma",
  NEV: "Melanocytic Nevus",
  BCC: "Basal Cell Carcinoma",
  ACK: "Actinic Keratosis",
  SEK: "Seborrheic Keratosis",
  SCC: "Squamous Cell Carcinoma"
};

const CLASS_CODES = [
  "MEL",
  "NEV",
  "BCC",
  "ACK",
  "SEK",
  "SCC"
];

function getImage(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;

  return `${API}${url.startsWith("/") ? "" : "/"}${url}`;
}

function getError(error) {
  if (!error?.response && error?.code === "ERR_NETWORK") {
    return "Cannot reach the DermAI API. Please make sure your backend is running.";
  }

  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map(item => item.msg || "Invalid input")
      .join(". ");
  }

  return error?.message || "Something went wrong. Please try again.";
}

function getRiskType(risk = "") {
  const value = String(risk || "").toUpperCase();

  if (
    value.includes("HIGH PRIORITY") ||
    value.includes("HIGH RISK")
  ) {
    return "high";
  }

  if (value.includes("MODERATE")) {
    return "moderate";
  }

  if (value.includes("LOW")) {
    return "low";
  }

  return "unknown";
}

function formatDate(date) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem("dermai_user")
    ) || null;
  } catch {
    return null;
  }
}

/* Authentication */

function Login({ registerMode = false, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = e => {
    setForm(current => ({
      ...current,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      if (registerMode) {
        await api.post("/auth/register", {
          full_name: form.full_name,
          email: form.email,
          password: form.password
        });

        navigate("/login", {
          state: { registered: true }
        });

        return;
      }

      const response = await api.post("/auth/login", {
        email: form.email,
        password: form.password
      });

      localStorage.setItem(
        "dermai_user",
        JSON.stringify(response.data)
      );

      setUser(response.data);
      navigate("/");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="brand brand-light">
          <div className="brand-icon">
            <Activity size={25} />
          </div>

          <div>
            <h2>Derm<span>AI</span></h2>
            <small>SKIN HEALTH INTELLIGENCE</small>
          </div>
        </div>

        <div className="auth-hero">
          <span className="eyebrow">
            AI POWERED SKIN IMAGE ANALYSIS
          </span>

          <h1>
            A smarter way to understand your skin.
          </h1>

          <p>
            Explore AI-assisted skin lesion image analysis,
            prediction confidence and visual explainability
            through Grad-CAM.
          </p>

          <div className="auth-feature">
            <ShieldCheck size={22} />

            <div>
              <b>Personal scan workspace</b>
              <p>Review and manage your previous scans.</p>
            </div>
          </div>

          <div className="auth-feature">
            <Microscope size={22} />

            <div>
              <b>AI-powered research</b>
              <p>Six-class skin lesion classification.</p>
            </div>
          </div>
        </div>

        <p className="auth-bottom">
          DermAI Research Prototype
        </p>
      </div>

      <div className="auth-right">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="mobile-brand">
            <Activity />
            DermAI
          </div>

          <span className="eyebrow">
            {registerMode ? "GET STARTED" : "WELCOME BACK"}
          </span>

          <h2>
            {registerMode
              ? "Create your account"
              : "Sign in to DermAI"}
          </h2>

          <p className="muted">
            {registerMode
              ? "Create your patient account to begin."
              : "Enter your account details to continue."}
          </p>

          {!registerMode && location.state?.registered && (
            <div className="success-message" role="status">
              <CheckCircle2 size={17} />
              Account created successfully. Please sign in.
            </div>
          )}

          {registerMode && (
            <label>
              Full name

              <input
                type="text"
                name="full_name"
                autoComplete="name"
                placeholder="Enter your full name"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </label>
          )}

          <label>
            Email address

            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Password

            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete={
                  registerMode
                    ? "new-password"
                    : "current-password"
                }
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />

              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword(value => !value)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && (
            <div className="error-message" role="alert">
              <AlertTriangle size={17} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary full-width"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : registerMode
                ? "Create account"
                : "Sign in"}
          </button>

          <p className="auth-switch">
            {registerMode
              ? "Already have an account?"
              : "New to DermAI?"}

            <button
              type="button"
              onClick={() =>
                navigate(registerMode ? "/login" : "/register")
              }
            >
              {registerMode ? "Sign in" : "Create account"}
            </button>
          </p>

          <div className="auth-disclaimer">
            <ShieldCheck size={15} />
            Research prototype. Not a medical diagnosis.
          </div>
        </form>
      </div>
    </div>
  );
}

/* Protected route */

function ProtectedRoute({ user }) {
  return user
    ? <Outlet />
    : <Navigate to="/login" replace />;
}

/* Application layout */

function Layout({ user, logout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    {
      path: "/",
      name: "Home",
      icon: HeartPulse,
      end: true
    },
    {
      path: "/dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
      end: true
    },
    {
      path: "/scan",
      name: "New Skin Scan",
      icon: ScanLine
    },
    {
      path: "/history",
      name: "Scan History",
      icon: History
    },
    {
      path: "/profile",
      name: "My Profile",
      icon: UserRound
    }
  ];

  return (
    <div className="app-layout">
      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-icon">
            <Activity size={24} />
          </div>

          <div>
            <h2>Derm<span>AI</span></h2>
            <small>SKIN HEALTH PLATFORM</small>
          </div>
        </div>

        <div className="side-heading">
          WORKSPACE
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {links.map(({ path, name, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-active" : ""}`
              }
            >
              <Icon size={19} />
              {name}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="privacy-card">
            <ShieldCheck size={21} />

            <div>
              <b>DermAI Research</b>
              <small>Responsible AI analysis</small>
            </div>
          </div>

          <button
            className="nav-item logout-button"
            onClick={logout}
          >
            <LogOut size={19} />
            Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-toggle"
            aria-label={
              mobileOpen ? "Close navigation" : "Open navigation"
            }
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(value => !value)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>

          <div className="breadcrumb">
            Workspace <span>/</span> <b>DermAI</b>
          </div>

          <div className="topbar-right">
            <div className="user-avatar">
              {user?.full_name?.[0]?.toUpperCase() || "U"}
            </div>

            <div className="topbar-user">
              <b>{user?.full_name || "Patient"}</b>
              <small>Patient account</small>
            </div>
          </div>
        </header>

        <div className="page-container">
          <Outlet />
        </div>

        <footer className="footer">
          DermAI © 2026 · AI Skin Lesion Research Platform
          <br />
          Not a substitute for professional medical diagnosis.
        </footer>
      </main>
    </div>
  );
}

/* Reusable components */

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {action}
    </div>
  );
}

function Loading() {
  return (
    <div className="loading-state" role="status">
      <div className="spinner" />
      Loading DermAI data...
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <FileImage size={38} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function RiskBadge({ risk }) {
  const type = getRiskType(risk);

  return (
    <span className={`risk-badge ${type}`}>
      {type === "high" && <AlertTriangle size={13} />}
      {type === "moderate" && <Info size={13} />}
      {type === "low" && <CheckCircle2 size={13} />}
      {type === "unknown" && <Info size={13} />}

      {risk || "UNSPECIFIED"}
    </span>
  );
}

function PredictionBars({ predictions }) {
  if (!Array.isArray(predictions) || !predictions.length) {
    return null;
  }

  return (
    <div className="prediction-list">
      {predictions.map(item => (
        <div
          className="prediction-row"
          key={item.class_code}
        >
          <div className="prediction-heading">
            <span>
              <b>{item.class_name}</b>
              <small>{item.class_code}</small>
            </span>

            <strong>
              {Number(item.confidence).toFixed(2)}%
            </strong>
          </div>

          <div className="progress-track">
            <div
              className={`progress-fill ${
                item.class_code === "MEL" ||
                item.class_code === "SCC"
                  ? "red"
                  : "teal"
              }`}
              style={{
                width: `${
                  Math.min(
                    100,
                    Math.max(0, Number(item.confidence) || 0)
                  )
                }%`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ScanTable({ scans }) {
  const navigate = useNavigate();

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>SCAN</th>
            <th>PREDICTION</th>
            <th>CONFIDENCE</th>
            <th>RISK LEVEL</th>
            <th>DATE</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {scans.map(scan => (
            <tr key={scan.id}>
              <td>
                <div className="table-image">
                  <img
                    src={getImage(scan.saved_image_url)}
                    alt="Skin scan"
                  />

                  <span>#{scan.id}</span>
                </div>
              </td>

              <td>
                <b>{scan.predicted_class}</b>

                <small className="table-subtitle">
                  {scan.predicted_code}
                </small>
              </td>

              <td>
                <b>
                  {Number(scan.confidence).toFixed(2)}%
                </b>
              </td>

              <td>
                <RiskBadge risk={scan.risk_level} />
              </td>

              <td className="table-date">
                {formatDate(scan.analyzed_at)}
              </td>

              <td>
                <button
                  className="icon-button"
                  onClick={() =>
                    navigate(`/result/${scan.id}`)
                  }
                  title="View report"
                  aria-label={`View report for scan ${scan.id}`}
                >
                  <ArrowUpRight size={19} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Dashboard */

function Dashboard({ user }) {
  const navigate = useNavigate();

  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadScans = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/history", {
        params: { user_id: user.id }
      });

      setScans(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, [user.id]);

  const total = scans.length;

  const high = scans.filter(
    scan => getRiskType(scan.risk_level) === "high"
  ).length;

  const moderate = scans.filter(
    scan => getRiskType(scan.risk_level) === "moderate"
  ).length;

  const low = scans.filter(
    scan => getRiskType(scan.risk_level) === "low"
  ).length;

  const unknown = scans.filter(
    scan => getRiskType(scan.risk_level) === "unknown"
  ).length;

  const average = total
    ? scans.reduce(
        (sum, scan) => sum + Number(scan.confidence || 0),
        0
      ) / total
    : 0;

  const latest = scans[0];

  const classCounts = CLASS_CODES.map(code => ({
    code,
    name: CLASS_NAMES[code],
    count: scans.filter(
      scan => scan.predicted_code === code
    ).length
  }));

  const maxClassCount = Math.max(
    1,
    ...classCounts.map(item => item.count)
  );

  const riskItems = [
    { name: "High priority", value: high, color: "red" },
    { name: "Moderate risk", value: moderate, color: "orange" },
    { name: "Low risk", value: low, color: "green" },
    ...(unknown
      ? [{ name: "Unspecified", value: unknown, color: "teal" }]
      : [])
  ];

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">PATIENT WORKSPACE</span>

          <h1>
            Good day, {user.full_name?.split(" ")[0] || "there"}!
          </h1>

          <p>
            Here's an overview of your DermAI skin scan activity.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate("/scan")}
        >
          <ScanLine size={17} />
          New Skin Scan
        </button>
      </div>

      {error && (
        <div
          className="error-message dashboard-error"
          role="alert"
        >
          <AlertTriangle size={18} />
          {error}
          <button onClick={loadScans}>Retry</button>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="section-heading">
            <h2>Overview</h2>

            <span>
              <Clock size={14} />
              Updated just now
            </span>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon teal">
                <ScanLine />
              </div>

              <div>
                <small>Total scans</small>
                <h2>{total}</h2>
                <span>All recorded scans</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon red">
                <AlertTriangle />
              </div>

              <div>
                <small>High priority</small>
                <h2>{high}</h2>
                <span>Require professional review</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">
                <Activity />
              </div>

              <div>
                <small>Moderate risk</small>
                <h2>{moderate}</h2>
                <span>Clinical evaluation advised</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <ChartNoAxesCombined />
              </div>

              <div>
                <small>Average confidence</small>
                <h2>{average.toFixed(1)}%</h2>
                <span>Across recorded predictions</span>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="card latest-card">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">MOST RECENT</span>
                  <h2>Latest skin analysis</h2>
                </div>

                {latest && (
                  <button
                    className="text-button"
                    onClick={() =>
                      navigate(`/result/${latest.id}`)
                    }
                  >
                    Full report
                    <ArrowUpRight size={15} />
                  </button>
                )}
              </div>

              {latest ? (
                <div className="latest-content">
                  <img
                    className="latest-image"
                    src={getImage(latest.saved_image_url)}
                    alt="Latest skin scan"
                  />

                  <div className="latest-details">
                    <span className="muted small-text">
                      SCAN #{latest.id}
                    </span>

                    <h3>{latest.predicted_class}</h3>

                    <RiskBadge risk={latest.risk_level} />

                    <div className="confidence-number">
                      {Number(latest.confidence).toFixed(2)}%
                      <small>Model confidence</small>
                    </div>

                    <p>{latest.risk_note}</p>

                    <small className="muted">
                      <CalendarDays size={13} />
                      {formatDate(latest.analyzed_at)}
                    </small>

                    <button
                      className="btn btn-outline"
                      onClick={() =>
                        navigate(`/result/${latest.id}`)
                      }
                    >
                      View analysis
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No scans yet"
                  description="Upload your first skin image to see your analysis here."
                />
              )}
            </section>

            <section className="card">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">RISK OVERVIEW</span>
                  <h2>Risk distribution</h2>
                </div>
              </div>

              {total > 0 ? (
                <div className="risk-summary">
                  {riskItems.map(item => (
                    <div className="risk-item" key={item.name}>
                      <div className="risk-item-heading">
                        <span>{item.name}</span>
                        <b>{item.value}</b>
                      </div>

                      <div className="progress-track">
                        <div
                          className={`progress-fill ${item.color}`}
                          style={{
                            width: `${(item.value / total) * 100}%`
                          }}
                        />
                      </div>

                      <small>
                        {((item.value / total) * 100).toFixed(1)}%
                        {" "}of scans
                      </small>
                    </div>
                  ))}

                  <div className="risk-disclaimer">
                    <Info size={17} />

                    <span>
                      These categories reflect the prototype's
                      predefined model risk mapping, not a clinical
                      assessment of your health.
                    </span>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No risk data"
                  description="Risk distribution will appear after your first scan."
                />
              )}
            </section>
          </div>

          <div className="dashboard-grid bottom-grid">
            <section className="card">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">MODEL OUTPUT</span>
                  <h2>Classification distribution</h2>
                </div>
              </div>

              {total > 0 ? (
                <div className="class-distribution">
                  {classCounts.map(item => (
                    <div className="class-item" key={item.code}>
                      <div className="class-item-label">
                        <b>{item.code}</b>
                        <span>{item.name}</span>
                        <strong>{item.count}</strong>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill teal"
                          style={{
                            width: `${
                              (item.count / maxClassCount) * 100
                            }%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No predictions available"
                  description="Your six-class prediction distribution will appear here."
                />
              )}
            </section>

            <section className="card">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">ACTIVITY</span>
                  <h2>Recent scan history</h2>
                </div>

                <button
                  className="text-button"
                  onClick={() => navigate("/history")}
                >
                  View all
                  <ArrowRight size={15} />
                </button>
              </div>

              {scans.length > 0 ? (
                <div className="recent-list">
                  {scans.slice(0, 5).map(scan => (
                    <button
                      className="recent-item"
                      key={scan.id}
                      onClick={() =>
                        navigate(`/result/${scan.id}`)
                      }
                    >
                      <img
                        src={getImage(scan.saved_image_url)}
                        alt="Scan"
                      />

                      <div className="recent-info">
                        <b>{scan.predicted_class}</b>

                        <small>
                          #{scan.id} · {formatDate(scan.analyzed_at)}
                        </small>

                        <RiskBadge risk={scan.risk_level} />
                      </div>

                      <div className="recent-score">
                        <b>
                          {Number(scan.confidence).toFixed(1)}%
                        </b>

                        <small>Confidence</small>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Your history is empty"
                  description="Your completed scans will appear here."
                />
              )}
            </section>
          </div>

          <div className="quick-actions">
            <button onClick={() => navigate("/scan")}>
              <div className="quick-icon">
                <UploadCloud />
              </div>

              <div>
                <b>Start a new scan</b>
                <small>Upload an image for AI analysis</small>
              </div>

              <ChevronRight />
            </button>

            <button onClick={() => navigate("/history")}>
              <div className="quick-icon blue">
                <History />
              </div>

              <div>
                <b>View all reports</b>
                <small>Explore your previous scan results</small>
              </div>

              <ChevronRight />
            </button>
          </div>
        </>
      )}
    </>
  );
}

/* New skin scan */

function Scan({ user }) {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectFile = selected => {
    if (!selected || loading) return;

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        selected.type
      )
    ) {
      setError("Please select a JPG, PNG, or WebP image.");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10 MB.");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError("");
  };

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const analyze = async () => {
    if (!file || loading) return;

    setLoading(true);
    setError("");

    const formData = new FormData();

    formData.append("file", file);
    formData.append("user_id", String(user.id));

    try {
      const response = await api.post("/predict", formData);

      navigate(`/result/${response.data.id}`, {
        state: { scan: response.data }
      });
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="AI IMAGE ANALYSIS"
        title="New skin scan"
        description="Upload a skin lesion image to run your DermAI research model."
      />

      <div className="scan-layout">
        <section className="card upload-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">IMAGE UPLOAD</span>
              <h2>Upload skin image</h2>
            </div>

            <ImageIcon size={23} />
          </div>

          <label
            className="upload-area"
            tabIndex={loading ? -1 : 0}
            role="button"
            aria-label="Choose a skin image"
            aria-disabled={loading}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.currentTarget.querySelector("input").click();
              }
            }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              selectFile(e.dataTransfer.files[0]);
            }}
          >
            {preview ? (
              <div className="preview-wrapper">
                <img
                  src={preview}
                  alt="Selected skin image"
                />

                <span className="preview-overlay">
                  Choose another image
                </span>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">
                  <UploadCloud size={32} />
                </div>

                <h3>Drag your image here</h3>

                <p>
                  Or click to browse files from your device.
                </p>

                <span className="btn btn-outline">
                  Browse image
                </span>

                <small>
                  JPG, PNG, WebP · Maximum 10 MB
                </small>
              </div>
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={loading}
              onChange={e => {
                selectFile(e.target.files[0]);
                e.target.value = "";
              }}
              hidden
            />
          </label>

          {file && (
            <div className="selected-file">
              <FileImage size={21} />

              <div>
                <b>{file.name}</b>

                <small>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </small>
              </div>

              <button
                className="icon-button danger-icon"
                aria-label="Remove selected image"
                disabled={loading}
                onClick={() => {
                  setFile(null);
                  setPreview("");
                  setError("");
                }}
              >
                <Trash2 size={17} />
              </button>
            </div>
          )}

          {error && (
            <div className="error-message" role="alert">
              <AlertTriangle size={17} />
              {error}
            </div>
          )}

          <button
            className="btn btn-primary full-width analyze-button"
            disabled={!file || loading}
            onClick={analyze}
          >
            {loading ? (
              <>
                <RefreshCw className="spin" size={18} />
                Analyzing image...
              </>
            ) : (
              <>
                <Microscope size={18} />
                Run AI Analysis
              </>
            )}
          </button>

          {loading && (
            <p className="muted loading-note" role="status">
              Please wait while the model processes the image
              and generates its Grad-CAM visualization.
            </p>
          )}
        </section>

        <aside className="scan-sidebar">
          <section className="card">
            <div className="card-heading">
              <h2>Analysis information</h2>
            </div>

            <div className="info-list">
              <div>
                <Microscope />

                <span>
                  <b>AI Model</b>
                  <small>MobileNetV3-Large</small>
                </span>
              </div>

              <div>
                <Activity />

                <span>
                  <b>Classification</b>
                  <small>Six skin lesion classes</small>
                </span>
              </div>

              <div>
                <Eye />

                <span>
                  <b>Explainability</b>
                  <small>Grad-CAM visualization</small>
                </span>
              </div>

              <div>
                <ShieldCheck />

                <span>
                  <b>Image processing</b>
                  <small>224 × 224 input size</small>
                </span>
              </div>
            </div>
          </section>

          <section className="notice-card">
            <AlertTriangle size={21} />

            <h3>Important medical notice</h3>

            <p>
              DermAI is a research prototype. It cannot diagnose
              skin conditions or replace examination by a
              qualified dermatologist.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}

/* Individual report */

function Results() {
  const { id } = useParams();
  const location = useLocation();

  const [scan, setScan] = useState(
    location.state?.scan || null
  );

  const [loading, setLoading] = useState(
    !location.state?.scan
  );

  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("");

  const handleDownload = async () => {
    if (downloading || !scan) return;

    setDownloading(true);
    setDownloadError("");
    setDownloadStatus("");

    try {
      const missing = await downloadReport(scan, getImage);

      setDownloadStatus(
        missing
          ? "PDF downloaded. Some images were unavailable and are marked in the report."
          : "PDF downloaded successfully."
      );
    } catch {
      setDownloadError(
        "Unable to create the PDF. Please try downloading again."
      );
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const cached = location.state?.scan;

    setError("");
    setDownloadError("");
    setDownloadStatus("");

    if (cached && String(cached.id) === String(id)) {
      setScan(cached);
      setLoading(false);

      return () => {
        active = false;
      };
    }

    setLoading(true);
    setScan(null);

    api.get(`/history/${id}`)
      .then(response => {
        if (active) {
          setScan(response.data);
        }
      })
      .catch(err => {
        if (active) {
          setError(getError(err));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id, location.state]);

  if (loading) {
    return <Loading />;
  }

  if (error || !scan) {
    return (
      <div className="card">
        <EmptyState
          title="Report unavailable"
          description={
            error || "The requested scan could not be found."
          }
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={`SCAN REPORT #${scan.id}`}
        title="Skin analysis results"
        description="Review the model's classification output and visual explanation."
        action={
          <div className="report-actions">
            <span className="report-date">
              <CalendarDays size={15} />
              {formatDate(scan.analyzed_at)}
            </span>

            <button
              className="btn btn-primary"
              onClick={handleDownload}
              disabled={downloading}
              aria-busy={downloading}
            >
              {downloading ? (
                <RefreshCw size={17} className="spin" />
              ) : (
                <Download size={17} />
              )}

              {downloading
                ? "Preparing PDF..."
                : "Download PDF"}
            </button>
          </div>
        }
      />

      {downloadError && (
        <div className="error-message" role="alert">
          {downloadError}
        </div>
      )}

      {downloadStatus && (
        <div className="success-message" role="status">
          {downloadStatus}
        </div>
      )}

      <div className="result-summary">
        <div className="result-image-card">
          <img
            src={getImage(scan.saved_image_url)}
            alt="Original skin lesion"
          />

          <span>Original uploaded image</span>
        </div>

        <div className="result-primary">
          <span className="eyebrow">PRIMARY PREDICTION</span>

          <h2>{scan.predicted_class}</h2>

          <span className="class-code">
            {scan.predicted_code}
          </span>

          <RiskBadge risk={scan.risk_level} />

          <div className="result-confidence">
            <strong>
              {Number(scan.confidence).toFixed(2)}%
            </strong>

            <span>Model confidence score</span>
          </div>

          <p>{scan.risk_note}</p>

          <div className="medical-warning">
            <AlertTriangle size={18} />

            <span>
              This AI output is not a confirmed diagnosis.
              Please consult a qualified dermatologist.
            </span>
          </div>
        </div>
      </div>

      <section className="card result-section">
        <div className="card-heading">
          <div>
            <span className="eyebrow">CLASSIFICATION</span>
            <h2>Class predictions</h2>
          </div>
        </div>

        <p className="muted">
          Scores represent the model's softmax outputs.
          They are not calibrated clinical probabilities.
        </p>

        <PredictionBars predictions={scan.top_predictions} />
      </section>

      <section className="card result-section">
        <div className="card-heading">
          <div>
            <span className="eyebrow">
              MODEL EXPLAINABILITY
            </span>

            <h2>Visual analysis</h2>
          </div>

          <Eye size={22} />
        </div>

        <div className="visual-grid">
          <div className="visual-card">
            <img
              src={getImage(scan.saved_image_url)}
              alt="Original input"
            />

            <h3>Original image</h3>
            <p>Image uploaded by the patient.</p>
          </div>

          <div className="visual-card">
            {scan.preprocessed_image_url ? (
              <img
                src={getImage(scan.preprocessed_image_url)}
                alt="Preprocessed image"
              />
            ) : (
              <div className="image-unavailable">
                Preprocessed image unavailable
              </div>
            )}

            <h3>Preprocessed image</h3>
            <p>Resized image used by the model.</p>
          </div>

          <div className="visual-card">
            {scan.gradcam_image_url ? (
              <img
                src={getImage(scan.gradcam_image_url)}
                alt="Grad-CAM overlay"
              />
            ) : (
              <div className="image-unavailable">
                Grad-CAM image unavailable
              </div>
            )}

            <h3>Grad-CAM visualization</h3>

            <p>
              Model activation heatmap overlay.
              This is an explanation aid, not a lesion boundary
              or clinical localization.
            </p>
          </div>
        </div>
      </section>

      <section className="card result-section">
        <div className="card-heading">
          <h2>Technical information</h2>
        </div>

        <div className="technical-grid">
          <div>
            <small>Scan ID</small>
            <b>#{scan.id}</b>
          </div>

          <div>
            <small>Predicted class</small>
            <b>{scan.predicted_code}</b>
          </div>

          <div>
            <small>Model version</small>
            <b>{scan.model_version || "Not available"}</b>
          </div>

          <div>
            <small>Analysis date</small>
            <b>{formatDate(scan.analyzed_at)}</b>
          </div>

          <div>
            <small>Original filename</small>

            <b>
              {scan.original_filename || "Not available"}
            </b>
          </div>
        </div>
      </section>
    </>
  );
}

/* Scan history */

function HistoryPage({ user }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/history", {
        params: { user_id: user.id }
      });

      setScans(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user.id]);

  const filtered = scans.filter(scan => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      String(scan.predicted_class || "")
        .toLowerCase()
        .includes(query) ||
      String(scan.predicted_code || "")
        .toLowerCase()
        .includes(query);

    const matchesRisk =
      filter === "all" ||
      getRiskType(scan.risk_level) === filter;

    return matchesSearch && matchesRisk;
  });

  return (
    <>
      <PageHeader
        eyebrow="PATIENT RECORDS"
        title="Scan history"
        description="View all your previously saved skin analysis reports."
      />

      <section className="card history-card">
        <div className="history-toolbar">
          <div className="search-field">
            <Search size={17} />

            <input
              aria-label="Search scans"
              placeholder="Search by disease or class..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            aria-label="Filter scans by risk level"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All risk levels</option>
            <option value="high">High priority</option>
            <option value="moderate">Moderate risk</option>
            <option value="low">Low risk</option>
            <option value="unknown">Unspecified</option>
          </select>

          <button
            className="btn btn-outline"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={loading ? "spin" : ""}
            />

            Refresh
          </button>
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <Loading />
        ) : filtered.length > 0 ? (
          <ScanTable scans={filtered} />
        ) : (
          <EmptyState
            title="No matching scans"
            description="Try changing your search or upload a new image."
          />
        )}

        <div className="history-footer">
          Showing {filtered.length} of {scans.length} records
        </div>
      </section>
    </>
  );
}

/* Profile */

function Profile({ user, logout }) {
  return (
    <>
      <PageHeader
        eyebrow="ACCOUNT SETTINGS"
        title="My profile"
        description="View your DermAI patient account information."
      />

      <div className="profile-layout">
        <section className="card profile-card">
          <div className="profile-avatar">
            {user.full_name?.[0]?.toUpperCase() || "U"}
          </div>

          <h2>{user.full_name}</h2>
          <p className="muted">DermAI Patient Account</p>

          <div className="profile-details">
            <div>
              <UserRound />

              <span>
                <small>Full name</small>
                <b>{user.full_name}</b>
              </span>
            </div>

            <div>
              <Mail />

              <span>
                <small>Email address</small>
                <b>{user.email}</b>
              </span>
            </div>

            <div>
              <Lock />

              <span>
                <small>Account ID</small>
                <b>#{user.id}</b>
              </span>
            </div>
          </div>

          <button
            className="btn btn-danger full-width"
            onClick={logout}
          >
            <LogOut size={17} />
            Sign out
          </button>
        </section>

        <section className="card profile-info">
          <div className="card-heading">
            <h2>About DermAI</h2>
            <Activity size={22} />
          </div>

          <p>
            DermAI is an AI-based skin lesion classification
            research prototype built using MobileNetV3-Large
            and the PAD-UFES-20 dataset.
          </p>

          <div className="profile-feature">
            <CheckCircle2 />
            Six-class classification
          </div>

          <div className="profile-feature">
            <CheckCircle2 />
            Grad-CAM explainability
          </div>

          <div className="profile-feature">
            <CheckCircle2 />
            Patient scan history
          </div>

          <div className="profile-feature">
            <CheckCircle2 />
            Downloadable PDF reports
          </div>

          <div className="notice-card">
            <AlertTriangle size={19} />
            {" "}DermAI does not provide medical diagnoses.
            Always seek professional medical advice.
          </div>
        </section>
      </div>
    </>
  );
}

/* Main application */

export default function App() {
  const [user, setUser] = useState(getStoredUser);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("dermai_user");
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user
            ? <Navigate to="/" replace />
            : <Login key="login" setUser={setUser} />
        }
      />

      <Route
        path="/register"
        element={
          user
            ? <Navigate to="/" replace />
            : (
              <Login
                key="register"
                registerMode
                setUser={setUser}
              />
            )
        }
      />

      <Route element={<ProtectedRoute user={user} />}>
        <Route
          element={<Layout user={user} logout={logout} />}
        >
          <Route
            path="/"
            element={<Home user={user} />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard user={user} />}
          />

          <Route
            path="/scan"
            element={<Scan user={user} />}
          />

          <Route
            path="/result/:id"
            element={<Results />}
          />

          <Route
            path="/history"
            element={<HistoryPage user={user} />}
          />

          <Route
            path="/profile"
            element={<Profile user={user} logout={logout} />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate to={user ? "/" : "/login"} replace />
        }
      />
    </Routes>
  );
}