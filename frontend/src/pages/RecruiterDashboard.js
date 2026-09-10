import React, { useEffect, useState } from "react";

import Sidebar from "../components/recruiter/Sidebar";
import Topbar from "../components/recruiter/Topbar";
import Overview from "../components/recruiter/Overview";
import JobsList from "../components/recruiter/JobsList";
import JobDetail from "../components/recruiter/JobDetail";
import Analytics from "../components/recruiter/Analytics";

import { recruiterApi } from "../services/RecruiterApi";

import "../components/recruiter/recruiter.css";

export default function RecruiterDashboard() {
  // --------------------------------------------------
  // LOGIN STATE
  // --------------------------------------------------

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("recruiterToken")
  );

  // --------------------------------------------------
  // DASHBOARD STATE
  // --------------------------------------------------

  const [activeView, setActiveView] = useState("overview");
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("recruiterToken", data.access_token);
      localStorage.setItem("recruiterName", data.name);
      localStorage.setItem("recruiterEmail", data.email);

      setLoggedIn(true);
    } catch (err) {
      setLoginError(
        "Cannot connect to the backend. Make sure Flask is running on port 5001."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // --------------------------------------------------
  // LOAD JOBS
  // --------------------------------------------------

  const loadJobs = async () => {
    setJobsLoading(true);
    setJobsError(null);

    try {
      const res = await recruiterApi.getJobs();
      setJobs(res.jobs || []);
    } catch (err) {
      setJobsError("Unable to load jobs. Please try again.");
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    if (loggedIn) {
      loadJobs();
    }
  }, [loggedIn]);

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem("recruiterToken");
    localStorage.removeItem("recruiterName");
    localStorage.removeItem("recruiterEmail");

    setLoggedIn(false);
    setJobs([]);
    setSelectedJobId(null);
    setActiveView("overview");
  };

  // --------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------

  const handleNavigate = (view) => {
    setSelectedJobId(null);
    setActiveView(view);
  };

  const selectedJob = jobs.find(
    (job) => job.job_id === selectedJobId
  );

  // --------------------------------------------------
  // LOGIN PAGE
  // --------------------------------------------------

  if (!loggedIn) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>

          <div style={styles.logoArea}>
            <div style={styles.logoDot}></div>
            <span>Resume Analyser</span>
          </div>

          <div style={styles.headingArea}>
            <h1 style={styles.headingAreaH1}>
              Recruiter Portal
            </h1>

            <p style={styles.headingAreaP}>
              Sign in to manage jobs and screen candidates.
            </p>
          </div>

          <form onSubmit={handleLogin}>

            <label style={styles.label}>
              Email
            </label>

            <input
              type="email"
              placeholder="Recruiter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />

            <label style={styles.label}>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />

            {loginError && (
              <div style={styles.error}>
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              style={styles.button}
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>

          </form>

          <p style={styles.footer}>
            Recruiter & HR Candidate Screening System
          </p>

        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // RECRUITER DASHBOARD
  // --------------------------------------------------

  return (
    <div className="rd-recruiter-shell">

      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <div className="rd-main">

        <Topbar />

        <main className="rd-content">

          {activeView === "overview" && (
            <Overview
              jobs={jobs}
              jobsLoading={jobsLoading}
            />
          )}

          {activeView === "jobs" && !selectedJob && (
            <JobsList
              jobs={jobs}
              jobsLoading={jobsLoading}
              jobsError={jobsError}
              onRefresh={loadJobs}
              onSelectJob={setSelectedJobId}
            />
          )}

          {activeView === "jobs" && selectedJob && (
            <JobDetail
              job={selectedJob}
              onBack={() => setSelectedJobId(null)}
            />
          )}

          {activeView === "candidates" && !selectedJob && (
            <JobsList
              jobs={jobs}
              jobsLoading={jobsLoading}
              jobsError={jobsError}
              onRefresh={loadJobs}
              onSelectJob={(id) => {
                setSelectedJobId(id);
                setActiveView("jobs");
              }}
            />
          )}

          {activeView === "analytics" && (
            <Analytics
              jobs={jobs}
              jobsLoading={jobsLoading}
            />
          )}

          {activeView === "settings" && (
            <div className="rd-panel">
              <h2>Settings</h2>
              <p className="rd-text-muted">
                Recruiter settings will be available here.
              </p>
            </div>
          )}

        </main>

      </div>

    </div>
  );
}

// --------------------------------------------------
// LOGIN PAGE STYLES
// --------------------------------------------------

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f0f2f5",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "'Outfit', sans-serif",
    padding: "24px",
  },

  card: {
    width: "100%",
    maxWidth: "430px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "42px",
    boxShadow: "0 10px 40px rgba(15, 23, 42, 0.10)",
  },

  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontFamily: "'Playfair Display', serif",
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "38px",
  },

  logoDot: {
    width: "11px",
    height: "11px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
  },

  headingArea: {
    marginBottom: "28px",
  },

  headingAreaH1: {
    fontSize: "30px",
    marginBottom: "8px",
    color: "#0f172a",
  },

  headingAreaP: {
    color: "#64748b",
    fontSize: "14px",
  },

  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "7px",
    marginTop: "18px",
  },

  input: {
    width: "100%",
    padding: "13px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    fontSize: "14px",
    outline: "none",
  },

  button: {
    width: "100%",
    marginTop: "26px",
    padding: "14px",
    border: "none",
    borderRadius: "9px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },

  error: {
    marginTop: "16px",
    padding: "10px 12px",
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: "8px",
    fontSize: "13px",
  },

  footer: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "28px",
  },
};

