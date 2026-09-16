import React, { useState } from "react";
import { FiUploadCloud, FiCheck, FiX } from "react-icons/fi";
import { recruiterApi } from "../../services/RecruiterApi";
import { Card, Button } from "../ui";

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
    <Card padding="sm" className="my-6">
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold text-ink-900 m-0">Upload Resumes</h2>
        <div className="text-ink-400 text-xs mt-1">
          Upload multiple PDF resumes for{" "}
          <strong>{job?.title}</strong>
        </div>
      </div>

      <label className="flex flex-col items-center justify-center min-h-[145px] border-[1.5px] border-dashed border-ink-300 rounded-lg bg-ink-50 cursor-pointer text-center transition-colors duration-200 hover:border-ink-500 hover:bg-ink-100">
        <input
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="w-10 h-10 rounded-full bg-ink-100 flex items-center justify-center text-brand-600 mb-2.5">
          <FiUploadCloud size={20} />
        </div>

        <div className="text-sm font-bold text-ink-700">
          Select PDF resumes
        </div>

        <div className="text-ink-400 text-[11px] mt-1">
          You can select multiple resumes at once
        </div>
      </label>

      {files.length > 0 && (
        <div className="mt-[18px]">
          <h4 className="m-0 mb-2.5 text-[13px] text-ink-700">
            Selected Resumes ({files.length})
          </h4>

          {files.map((file) => (
            <div
              key={`${file.name}-${file.size}`}
              className="flex items-center justify-between gap-4 py-2 border-b border-ink-100 text-xs"
            >
              <span>{file.name}</span>
              <span className="text-ink-400 text-[11px]">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-red-700 text-[11px] mt-1.5">
          {error}
        </div>
      )}

      <Button
        variant="primary"
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        className="mt-4"
      >
        {uploading
          ? "Analyzing Resumes..."
          : `Upload ${files.length || ""} Resume${
              files.length === 1 ? "" : "s"
            }`}
      </Button>

      {results.length > 0 && (
        <div className="mt-[18px]">
          <h4 className="m-0 mb-2.5 text-[13px] text-ink-700">Upload Results</h4>

          {results.map((result) => (
            <div
              key={result.filename}
              className={[
                "flex items-start gap-2.5 p-2.5 rounded-md mt-1.5 text-xs",
                result.success ? "bg-green-50" : "bg-red-50",
              ].join(" ")}
            >
              <span>
                {result.success ? <FiCheck /> : <FiX />}
              </span>

              <div>
                <strong>{result.filename}</strong>
                <div className="text-ink-400 text-[11px]">
                  {result.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
