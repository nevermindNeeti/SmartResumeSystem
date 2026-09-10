import React, { useState } from "react";
import { recruiterApi } from "../../services/RecruiterApi";

export default function UploadResumes({ job, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    setFiles(selectedFiles);
    setResults([]);
    setError(null);
  };

  const handleUpload = async () => {
    if (!job || files.length === 0) {
      setError("Please select at least one PDF resume.");
      return;
    }

    setUploading(true);
    setError(null);
    setResults([]);

    const uploadResults = [];

    for (const file of files) {
      try {
        const result = await recruiterApi.uploadResume(
          job.job_id,
          file
        );

        uploadResults.push({
          filename: file.name,
          success: true,
          message: result.message || "Uploaded successfully",
        });
      } catch (err) {
        uploadResults.push({
          filename: file.name,
          success: false,
          message: "Upload failed",
        });
      }
    }

    setResults(uploadResults);
    setUploading(false);

    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  return (
    <div className="rd-upload-card">
      <div className="rd-section-header">
        <div>
          <h2>Upload Resumes</h2>
          <div className="rd-text-muted">
            Upload multiple PDF resumes for{" "}
            <strong>{job?.title}</strong>
          </div>
        </div>
      </div>

      <label className="rd-upload-zone">
        <input
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileChange}
        />

        <div className="rd-upload-icon">↑</div>

        <div className="rd-upload-title">
          Select PDF resumes
        </div>

        <div className="rd-upload-subtitle">
          You can select multiple resumes at once
        </div>
      </label>

      {files.length > 0 && (
        <div className="rd-selected-files">
          <h4>
            Selected Resumes ({files.length})
          </h4>

          {files.map((file) => (
            <div
              key={`${file.name}-${file.size}`}
              className="rd-file-row"
            >
              <span>{file.name}</span>
              <span className="rd-text-muted">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rd-inline-error">
          {error}
        </div>
      )}

      <button
        className="rd-btn-primary"
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
      >
        {uploading
          ? "Analyzing Resumes..."
          : `Upload ${files.length || ""} Resume${
              files.length === 1 ? "" : "s"
            }`}
      </button>

      {results.length > 0 && (
        <div className="rd-upload-results">
          <h4>Upload Results</h4>

          {results.map((result) => (
            <div
              key={result.filename}
              className={
                result.success
                  ? "rd-upload-result success"
                  : "rd-upload-result failed"
              }
            >
              <span>
                {result.success ? "✓" : "✕"}
              </span>

              <div>
                <strong>{result.filename}</strong>
                <div className="rd-text-muted">
                  {result.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}