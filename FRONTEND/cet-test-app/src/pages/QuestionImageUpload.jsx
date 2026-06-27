import { useState, useRef } from "react";
import axios from "axios";
import "./QuestionImageUpload.css";

function QuestionImageUpload() {
  // ===============================
  // States
  // ===============================
  const [uploadMode, setUploadMode] = useState("single"); // single or multiple
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [verifyingIndex, setVerifyingIndex] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef(null);

  // Form fields for metadata
  const [metadata, setMetadata] = useState({
    subject: "physics",
    difficulty: "medium",
    section: "",
  });

  // Verification form for extracted questions
  const [verificationForms, setVerificationForms] = useState([]);

  // ===============================
  // File Selection Handler
  // ===============================
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    if (uploadMode === "single" && files.length > 1) {
      setError("Please select only one file for single upload mode");
      return;
    }

    // Validate file types
    const validFiles = files.filter((file) => {
      if (!["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"].includes(file.type)) {
        setError(`${file.name} is not a valid image format`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    setSelectedFiles(validFiles);

    // Generate preview URLs
    const urls = validFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    setError("");
  };

  // ===============================
  // Upload and Process
  // ===============================
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one image");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setExtractedQuestions([]);

    try {
      if (uploadMode === "single") {
        await uploadSingleQuestion();
      } else {
        await uploadMultipleQuestions();
      }
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // Single Question Upload
  // ===============================
  const uploadSingleQuestion = async () => {
    const formData = new FormData();
    formData.append("file", selectedFiles[0]);
    formData.append("subject", metadata.subject);
    formData.append("difficulty", metadata.difficulty);
    formData.append("section", metadata.section);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/upload-question-image",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 50
            );
            setProcessingProgress(progress);
          },
        }
      );

      setProcessingProgress(100);

      if (response.data.success) {
        setExtractedQuestions([response.data.data]);
        setVerificationForms([
          {
            ...response.data.data,
            correct: null,
            isEditing: true,
          },
        ]);
        setSuccess("Image processed successfully. Please verify the content.");
      }
    } catch (err) {
      throw new Error(
        err.response?.data?.detail || "Failed to upload image"
      );
    }
  };

  // ===============================
  // Multiple Questions Upload
  // ===============================
  const uploadMultipleQuestions = async () => {
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/upload-multiple-questions",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setProcessingProgress(progress);
          },
        }
      );

      if (response.data.results.length > 0) {
        setExtractedQuestions(response.data.results);
        setVerificationForms(
          response.data.results.map((q) => ({
            ...q,
            correct: null,
            isEditing: true,
          }))
        );
        setSuccess(`Processed ${response.data.processed} images successfully`);
      }

      if (response.data.errors.length > 0) {
        setError(
          `${response.data.errors.length} image(s) failed to process`
        );
      }
    } catch (err) {
      throw new Error(
        err.response?.data?.detail || "Failed to upload images"
      );
    }
  };

  // ===============================
  // Handle Verification Form Changes
  // ===============================
  const updateVerificationForm = (index, field, value) => {
    const updated = [...verificationForms];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setVerificationForms(updated);
  };

  const handleQuestionEdit = (index, field, value) => {
    const updated = [...verificationForms];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setVerificationForms(updated);
  };

  const handleOptionEdit = (index, optionIndex, value) => {
    const updated = [...verificationForms];
    const options = [...updated[index].options];
    options[optionIndex] = value;
    updated[index] = {
      ...updated[index],
      options,
    };
    setVerificationForms(updated);
  };

  const handleAddOption = (index) => {
    const updated = [...verificationForms];
    updated[index].options.push("");
    setVerificationForms(updated);
  };

  const handleRemoveOption = (index, optionIndex) => {
    const updated = [...verificationForms];
    updated[index].options = updated[index].options.filter(
      (_, i) => i !== optionIndex
    );
    setVerificationForms(updated);
  };

  // ===============================
  // Save Question
  // ===============================
  const saveQuestion = async (index) => {
    const form = verificationForms[index];

    if (!form.correct) {
      setError("Please select the correct answer");
      return;
    }

    if (form.options.length < 2) {
      setError("Please have at least 2 options");
      return;
    }

    setVerifyingIndex(index);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/verify-and-save-question",
        {
          question: form.question,
          options: form.options,
          correct_answer: form.correct,
          subject: form.subject,
          difficulty: form.difficulty,
          section: form.section,
          image_path: form.image_path,
        }
      );

      if (response.data.success) {
        const updated = [...verificationForms];
        updated[index].isEditing = false;
        updated[index].saved = true;
        setVerificationForms(updated);
        setSuccess(`Question ${index + 1} saved successfully!`);
      }
    } catch (err) {
      setError(`Failed to save question: ${err.response?.data?.detail || err.message}`);
    } finally {
      setVerifyingIndex(null);
    }
  };

  // ===============================
  // Reset
  // ===============================
  const handleReset = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setExtractedQuestions([]);
    setVerificationForms([]);
    setError("");
    setSuccess("");
    setProcessingProgress(0);
    fileInputRef.current.value = "";
  };

  // ===============================
  // Render
  // ===============================

  return (
    <div className="upload-container">
      <div className="upload-wrapper">
        {/* Header */}
        <div className="upload-header">
          <h1>📸 Question Image Upload</h1>
          <p>Upload question images and extract text using OCR technology</p>
        </div>

        {/* Mode Selection */}
        {extractedQuestions.length === 0 && (
          <div className="mode-selector">
            <button
              className={`mode-btn ${uploadMode === "single" ? "active" : ""}`}
              onClick={() => {
                setUploadMode("single");
                handleReset();
              }}
            >
              📄 Single Question
            </button>
            <button
              className={`mode-btn ${uploadMode === "multiple" ? "active" : ""}`}
              onClick={() => {
                setUploadMode("multiple");
                handleReset();
              }}
            >
              📚 Batch Upload
            </button>
          </div>
        )}

        {/* Upload Area */}
        {extractedQuestions.length === 0 ? (
          <div className="upload-section">
            <div
              className="upload-area"
              onClick={() => fileInputRef.current.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("drag-over");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("drag-over");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("drag-over");
                handleFileSelect({ target: { files: e.dataTransfer.files } });
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple={uploadMode === "multiple"}
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <div className="upload-icon">📤</div>
              <h3>Click or Drag Images Here</h3>
              <p>Supported: JPEG, PNG, WebP, BMP, TIFF (Max 10MB each)</p>
            </div>

            {/* Metadata Form (Single Mode) */}
            {uploadMode === "single" && selectedFiles.length > 0 && (
              <div className="metadata-form">
                <h3>Question Details</h3>
                <div className="form-group">
                  <label>Subject</label>
                  <select
                    value={metadata.subject}
                    onChange={(e) =>
                      setMetadata({ ...metadata, subject: e.target.value })
                    }
                  >
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="math">Mathematics</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Difficulty</label>
                  <select
                    value={metadata.difficulty}
                    onChange={(e) =>
                      setMetadata({ ...metadata, difficulty: e.target.value })
                    }
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Section/Topic</label>
                  <input
                    type="text"
                    placeholder="e.g., Thermodynamics, Kinematics"
                    value={metadata.section}
                    onChange={(e) =>
                      setMetadata({ ...metadata, section: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {/* File Preview */}
            {previewUrls.length > 0 && (
              <div className="file-preview">
                <h3>Preview ({previewUrls.length} file{previewUrls.length > 1 ? "s" : ""})</h3>
                <div className="preview-grid">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="preview-item">
                      <img src={url} alt={`Preview ${idx + 1}`} />
                      <p>{selectedFiles[idx].name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Action Buttons */}
            {selectedFiles.length > 0 && (
              <div className="action-buttons">
                <button
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={loading}
                >
                  {loading ? `Processing... ${processingProgress}%` : "🚀 Upload & Process"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            )}

            {loading && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          /* Verification Section */
          <div className="verification-section">
            <h2>Verify Extracted Questions</h2>
            <p className="subtitle">
              Please review and correct any misrecognized text, then select the correct answer for each question.
            </p>

            {verificationForms.map((form, index) => (
              <div
                key={index}
                className={`question-verification ${form.saved ? "completed" : ""}`}
              >
                <div className="verification-header">
                  <span className="question-number">Question {index + 1}</span>
                  {form.saved && <span className="status-badge saved">✓ Saved</span>}
                  {form.isEditing && !form.saved && (
                    <span className="status-badge editing">✎ Editing</span>
                  )}
                </div>

                {/* Image Preview */}
                {form.image_path && (
                  <div className="image-preview">
                    <img src={form.image_path} alt={`Question ${index + 1}`} />
                  </div>
                )}

                {/* Question Text */}
                <div className="form-group">
                  <label>Question</label>
                  <textarea
                    value={form.question}
                    onChange={(e) =>
                      handleQuestionEdit(index, "question", e.target.value)
                    }
                    disabled={!form.isEditing}
                    rows="3"
                  />
                </div>

                {/* Options */}
                <div className="options-section">
                  <label>Options</label>
                  {form.options.map((option, optIdx) => (
                    <div key={optIdx} className="option-input-group">
                      <input
                        type="radio"
                        id={`correct-${index}-${optIdx}`}
                        name={`correct-${index}`}
                        value={option}
                        checked={form.correct === option}
                        onChange={(e) =>
                          updateVerificationForm(index, "correct", e.target.value)
                        }
                        disabled={!form.isEditing}
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) =>
                          handleOptionEdit(index, optIdx, e.target.value)
                        }
                        disabled={!form.isEditing}
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                      />
                      {form.isEditing && (
                        <button
                          className="btn-remove"
                          onClick={() => handleRemoveOption(index, optIdx)}
                          title="Remove option"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  {form.isEditing && (
                    <button
                      className="btn-add-option"
                      onClick={() => handleAddOption(index)}
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                {/* Metadata */}
                <div className="metadata-section">
                  <div className="form-group">
                    <label>Subject</label>
                    <select
                      value={form.subject || ""}
                      onChange={(e) =>
                        updateVerificationForm(index, "subject", e.target.value)
                      }
                      disabled={!form.isEditing}
                    >
                      <option value="">Select Subject</option>
                      <option value="physics">Physics</option>
                      <option value="chemistry">Chemistry</option>
                      <option value="math">Mathematics</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Difficulty</label>
                    <select
                      value={form.difficulty || "medium"}
                      onChange={(e) =>
                        updateVerificationForm(index, "difficulty", e.target.value)
                      }
                      disabled={!form.isEditing}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Save Button */}
                {form.isEditing && !form.saved && (
                  <button
                    className="btn btn-save"
                    onClick={() => saveQuestion(index)}
                    disabled={verifyingIndex === index}
                  >
                    {verifyingIndex === index ? "Saving..." : "✓ Save Question"}
                  </button>
                )}

                {error && (
                  <div className="alert alert-error" style={{ marginTop: "1rem" }}>
                    {error}
                  </div>
                )}
              </div>
            ))}

            {/* Bulk Actions */}
            <div className="bulk-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  const allSaved = verificationForms.every((f) => f.saved);
                  if (allSaved) {
                    setSuccess("All questions saved successfully!");
                    handleReset();
                  }
                }}
              >
                ✓ Complete Upload
              </button>
              <button className="btn btn-secondary" onClick={handleReset}>
                Upload More
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionImageUpload;