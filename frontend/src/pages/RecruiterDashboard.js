import React, { useEffect, useState } from "react";

import Sidebar from "../components/recruiter/Sidebar";
import Topbar from "../components/recruiter/Topbar";
import Overview from "../components/recruiter/Overview";
import JobsList from "../components/recruiter/JobsList";
import JobDetail from "../components/recruiter/JobDetail";
import Analytics from "../components/recruiter/Analytics";

import { recruiterApi } from "../services/RecruiterApi";
import { Card, Button, Input } from "../components/ui";

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
      <div className="fixed inset-0 top-16 overflow-y-auto bg-ink-100 flex justify-center items-center font-body p-6">
        <Card padding="none" rounded="2xl" shadow="raised" className="w-full max-w-[430px] px-10 py-[42px]">

          <div className="flex items-center gap-2.5 font-display text-xl font-bold text-ink-900 mb-9">
            <div className="w-[11px] h-[11px] rounded-full bg-[linear-gradient(135deg,#2563eb,#0ea5e9)]" />
            <span>Resume Analyser</span>
          </div>

          <div className="mb-7">
            <h1 className="font-display text-[30px] font-bold mb-2 text-ink-900">
              Recruiter Portal
            </h1>

            <p className="text-ink-500 text-sm">
              Sign in to manage jobs and screen candidates.
            </p>
          </div>

          <form onSubmit={handleLogin}>

            <label className="block text-[13px] font-semibold text-ink-700 mb-1.5 mt-[18px]">
              Email
            </label>

            <Input
              type="email"
              size="lg"
              placeholder="Recruiter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className="block text-[13px] font-semibold text-ink-700 mb-1.5 mt-[18px]">
              Password
            </label>

            <Input
              type="password"
              size="lg"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {loginError && (
              <div className="mt-4 px-3 py-2.5 bg-red-50 text-red-600 rounded-lg text-[13px]">
                {loginError}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="xl"
              disabled={loginLoading}
              className="w-full mt-6 justify-center"
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </Button>

          </form>

          <p className="text-center text-ink-400 text-xs mt-7">
            Recruiter & HR Candidate Screening System
          </p>

        </Card>
      </div>
    );
  }

  // --------------------------------------------------
  // RECRUITER DASHBOARD
  // --------------------------------------------------

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-ink-100 text-ink-900 font-body overflow-hidden">

      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        <Topbar />

        <main className="flex-1 overflow-y-auto p-5 md:p-8 max-w-[1500px] mx-auto w-full">

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
              onJobCreated={loadJobs}
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
              onJobCreated={loadJobs}
            />
          )}

          {activeView === "analytics" && (
            <Analytics
              jobs={jobs}
              jobsLoading={jobsLoading}
            />
          )}

          {activeView === "settings" && (
            <Card padding="lg">
              <h2 className="font-display text-xl font-bold text-ink-900 mb-2">Settings</h2>
              <p className="text-ink-400 text-xs">
                Recruiter settings will be available here.
              </p>
            </Card>
          )}

        </main>

      </div>

    </div>
  );
}

