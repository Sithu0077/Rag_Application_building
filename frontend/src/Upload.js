import React, { useState } from "react";

function Upload({ uploadedFiles, setUploadedFiles }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 🔼 Handle file upload
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        // ✅ Corrected: use uploaded_files from backend
        const uploadedList = data.uploaded_files?.map((f) => f.filename) || [];
        setUploadedFiles((prev) => [...prev, ...uploadedList]);

        alert("✅ Files uploaded successfully!");
      } else {
        console.error("Upload failed:", data);
        alert("❌ Upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Failed to upload files. Please check backend connection.");
    } finally {
      setUploading(false);
    }
  };

  // 🔄 Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // 🧠 UI
  return (
    <div className="space-y-4">
      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
          isDragging
            ? "border-purple-500 bg-purple-50 scale-105"
            : "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-25"
        }`}
      >
        {uploading ? (
          <div className="space-y-4">
            <div className="inline-block">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-purple-600 font-semibold text-lg">
              Uploading files...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-6xl animate-bounce">📁</div>
            <p className="text-gray-700 text-lg font-semibold mb-2">
              Drag & Drop your files here
            </p>
            <p className="text-gray-500 text-sm mb-6">
              or click below to browse
            </p>

            <label className="inline-block">
              <input
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />
              <span className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-xl cursor-pointer shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
                <span className="text-xl">📎</span>
                <span>Choose Files</span>
              </span>
            </label>

            <p className="text-xs text-gray-400 mt-4">
              Supports PDF, DOCX, and TXT
            </p>
          </>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Uploaded Files ({uploadedFiles.length})
          </h3>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-100 transform transition-all duration-200 hover:scale-102 hover:shadow-md animate-slide-up"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-white text-lg">📄</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {file}
                    </p>
                    <p className="text-xs text-gray-500">Ready for chat</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setUploadedFiles((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                  className="flex-shrink-0 ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-all duration-200"
                  title="Remove file"
                >
                  <span className="text-xl">🗑️</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Upload;
