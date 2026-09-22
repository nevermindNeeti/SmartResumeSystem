const BASE_URL = "http://127.0.0.1:5001";

function getToken() {
  return localStorage.getItem("recruiterToken");
}

async function request(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("recruiterToken");
    localStorage.removeItem("recruiterName");
    localStorage.removeItem("recruiterEmail");

    window.location.reload();

    throw new Error("Session expired");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.status === 204 ? null : res.json();
}

export const recruiterApi = {
  getJobs: () => request("/jobs"),

  createJob: (data) =>
    request("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateJob: (jobId, data) =>
    request(`/jobs/${jobId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getCandidates: (jobId) =>
    request(`/jobs/${jobId}/candidates`),

  uploadResume: (jobId, file) => {
    const formData = new FormData();

    formData.append("resume", file);

    return request(`/jobs/${jobId}/candidates`, {
      method: "POST",
      body: formData,
    });
  },

  updateCandidateStatus: (candidateId, status) =>
    request(`/candidates/${candidateId}/status`, {
      method: "PUT",
      body: JSON.stringify({
        status,
      }),
    }),
};

