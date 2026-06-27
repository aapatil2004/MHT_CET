import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import katex from "katex";

import "katex/dist/katex.min.css";
import "./AdminPage.css";

function AdminPage() {
  // =========================================
  // Form State
  // =========================================
  const [form, setForm] = useState({
    id: null,
    subject: "",
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct: "",
    image: null,
    image_preview: null,
  });

  // Use ref to control file input
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/dashboard");
  };

  // =========================================
  // State
  // =========================================
  const [questions, setQuestions] = useState([]);
  const [uploadMode, setUploadMode] = useState("text");
  const [loading, setLoading] = useState(false);

  // =========================================
  // Render Latex
  // =========================================
  const renderLatex = (text) => {
    try {
      return {
        __html: katex.renderToString(text, {
          throwOnError: false,
        }),
      };
    } catch {
      return { __html: text };
    }
  };

  // =========================================
  // Fetch Questions
  // =========================================
  const fetchQuestions = async () => {
    try {
      const res = await axios.get("http://localhost:8000/questions");
      setQuestions(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  // =========================================
  // Initial Load
  // =========================================
  useEffect(() => {
    fetchQuestions();
  }, []);

  // =========================================
  // Handle Change
  // =========================================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================================
  // Image Upload
  // =========================================
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validate Type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!validTypes.includes(file.type)) {
      alert("Invalid image format");
      return;
    }

    // Validate Size
    if (file.size > 10 * 1024 * 1024) {
      alert("Maximum image size is 10MB");
      return;
    }

    const previewURL = URL.createObjectURL(file);

    setForm({
      ...form,
      image: file,
      image_preview: previewURL,
    });
  };

  // =========================================
  // Remove Image
  // =========================================
  const handleRemoveImage = () => {
    if (form.image_preview) {
      URL.revokeObjectURL(form.image_preview);
    }

    // Reset file input properly
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setForm({
      ...form,
      image: null,
      image_preview: null,
    });
  };

  // =========================================
  // Handle Correct Answer
  // =========================================
  const handleCorrectChange = (e) => {
    const selected = e.target.value;

    let value = "";

    if (selected === "A") value = form.option_a;
    if (selected === "B") value = form.option_b;
    if (selected === "C") value = form.option_c;
    if (selected === "D") value = form.option_d;

    setForm({
      ...form,
      correct: value,
    });
  };

  // =========================================
  // Submit Question
  // =========================================
  const handleSubmit = async () => {
    try {
      setLoading(true);

      // =====================================
      // TEXT MODE
      // =====================================
      if (uploadMode === "text") {
        const payload = {
          subject: form.subject,
          question: form.question,
          option_a: form.option_a,
          option_b: form.option_b, // Fix: Changed from form.option_c to form.option_b
          option_c: form.option_c,
          option_d: form.option_d,
          correct: form.correct,
        };

        // UPDATE
        if (form.id) {
          await axios.put(
            `http://localhost:8000/questions/${form.id}`,
            payload
          );

          alert("Question updated ✅");
        }

        // CREATE
        else {
          await axios.post(
            "http://localhost:8000/questions",
            payload
          );

          alert("Question added ✅");
        }
      }

      // =====================================
      // IMAGE MODE
      // =====================================
      else {
        if (!form.image) {
          alert("Please select an image");
          return;
        }

        // Client-side validation for required text fields in image mode
        if (!form.subject || form.subject.trim() === "") {
          alert("Please select a subject.");
          setLoading(false);
          return;
        }
        if (!form.option_a || form.option_a.trim() === "") {
          alert("Option A is required.");
          setLoading(false);
          return;
        }
        if (!form.option_b || form.option_b.trim() === "") {
          alert("Option B is required.");
          setLoading(false);
          return;
        }
        if (!form.option_c || form.option_c.trim() === "") {
          alert("Option C is required.");
          setLoading(false);
          return;
        }
        if (!form.option_d || form.option_d.trim() === "") {
          alert("Option D is required.");
          setLoading(false);
          return;
        }
        if (!form.correct || form.correct.trim() === "") {
          alert("Please select the correct answer.");
          setLoading(false);
          return;
        }

        const formData = new FormData();

        formData.append("file", form.image);
        formData.append("subject", form.subject);
        formData.append("question", form.question);
        formData.append("option_a", form.option_a);
        formData.append("option_b", form.option_b);
        formData.append("option_c", form.option_c);
        formData.append("option_d", form.option_d);
        formData.append("correct", form.correct);

        // UPDATE
        if (form.id) {
          await axios.put(
            `http://localhost:8000/questions/${form.id}/update-with-image`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          alert("Question updated with image ✅");
        }

        // CREATE
        else {
          await axios.post(
            "http://localhost:8000/questions/upload-image",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          alert("Image question added ✅");
        }
      }

      // =====================================
      // Reset Form
      // =====================================
      setForm({
        id: null,
        subject: "",
        question: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct: "",
        image: null,
        image_preview: null,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setUploadMode("text");

      fetchQuestions();

    } catch (err) {
      console.error("Submit error:", err);

      alert(
        "Error: " +
        (err.response?.data?.detail || err.message)
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // Delete Question
  // =========================================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this question?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `http://localhost:8000/questions/${id}`
      );

      alert("Question deleted ✅");

      fetchQuestions();

    } catch (err) {
      console.error("Delete error:", err);

      alert("Failed to delete question");
    }
  };

  // =========================================
  // Edit Question
  // =========================================
  const handleEdit = (q) => {
    setForm({
      id: q.id,
      subject: q.subject || "",
      question: q.question || "",
      option_a: q.options[0] || "",
      option_b: q.options[1] || "",
      option_c: q.options[2] || "",
      option_d: q.options[3] || "",
      correct: q.correct || "",
      image: null,
      image_preview: q.image_url || null,
    });

    setUploadMode(q.has_image ? "image" : "text");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================
  // UI
  // =========================================
  return (
    <div className="admin-container">

      {/* =====================================
          HEADER
      ===================================== */}
      <div className="admin-header">
        <h1 className="admin-title">
          📚 MHT-CET Admin Panel
        </h1>

        <p className="admin-subtitle">
          Manage Questions, Upload Images & Control Test Content
        </p>

        <button
          className="btn-dashboard"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        <button
          className="btn-danger"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {/* =====================================
          FORM CARD
      ===================================== */}
      <div className="admin-form-card">

        <h2 className="form-title">
          {form.id
            ? "✏️ Edit Question"
            : "➕ Add New Question"}
        </h2>

        {/* =====================================
            MODE SELECTOR
        ===================================== */}
        <div className="mode-selector">

          <label>
            <input
              type="radio"
              value="text"
              checked={uploadMode === "text"}
              onChange={(e) => {
                setUploadMode(e.target.value);
                handleRemoveImage();
              }}
            />

            Text Question
          </label>

          <label>
            <input
              type="radio"
              value="image"
              checked={uploadMode === "image"}
              onChange={(e) =>
                setUploadMode(e.target.value)
              }
            />

            Image Question
          </label>
        </div>

        {/* =====================================
            SUBJECT
        ===================================== */}
        <select
          name="subject"
          value={form.subject}
          onChange={handleChange}
          className="input-field"
        >
          <option value="">
            Select Subject
          </option>

          <option value="Physics">
            Physics
          </option>

          <option value="Chemistry">
            Chemistry
          </option>

          <option value="Mathematics">
            Mathematics
          </option>

          <option value="Biology">
            Biology
          </option>
        </select>

        {/* =====================================
            IMAGE UPLOAD
        ===================================== */}
        {uploadMode === "image" && (
          <div className="image-upload-box">

            <h4>📷 Upload Question Image</h4>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            <p>
              Supported: JPG, PNG, WEBP, BMP, TIFF
              (Max 10MB)
            </p>

            {form.image_preview && (
              <div className="image-preview">

                <img
                  src={form.image_preview}
                  alt="Preview"
                />

                <button
                  className="btn-danger"
                  onClick={handleRemoveImage}
                >
                  Remove Image
                </button>

              </div>
            )}
          </div>
        )}

        {/* =====================================
            QUESTION
        ===================================== */}
        <textarea
          name="question"
          placeholder={
            uploadMode === "image"
              ? "Enter image description (optional)"
              : "Enter question"
          }
          value={form.question}
          onChange={handleChange}
        />

        {/* =====================================
            OPTIONS
        ===================================== */}
        {[
          "option_a",
          "option_b",
          "option_c",
          "option_d",
        ].map((opt, i) => (
          <input
            key={i}
            type="text"
            name={opt}
            value={form[opt]}
            onChange={handleChange}
            placeholder={`Option ${String.fromCharCode(
              65 + i
            )}`}
            className="input-field"
          />
        ))}

        {/* =====================================
            CORRECT ANSWER
        ===================================== */}
        <select
          onChange={handleCorrectChange}
          className="input-field"
        >
          <option value="">
            Select Correct Answer
          </option>

          <option value="A">
            Option A
          </option>

          <option value="B">
            Option B
          </option>

          <option value="C">
            Option C
          </option>

          <option value="D">
            Option D
          </option>
        </select>

        {/* =====================================
            SUBMIT BUTTON
        ===================================== */}
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? "Uploading..."
            : form.id
            ? "Update Question"
            : "Add Question"}
        </button>

      </div>

      {/* =====================================
          QUESTIONS LIST
      ===================================== */}
      <h2 className="form-title">
        📄 All Questions ({questions.length})
      </h2>

      {questions.length > 0 ? (
        <div className="question-grid">

          {questions.map((q) => (
            <div
              key={q.id}
              className="question-card"
            >

              {/* IMAGE */}
              {q.has_image && q.image_url && (
                <img
                  src={q.image_url}
                  alt="Question"
                />
              )}

              {/* QUESTION */}
              {q.question && (
                <p
                  className="question-title"
                  dangerouslySetInnerHTML={renderLatex(
                    q.question
                  )}
                />
              )}

              {/* OPTIONS */}
              <ul className="question-options">
                {q.options.map((opt, i) => (
                  <li
                    key={i}
                    dangerouslySetInnerHTML={renderLatex(
                      opt
                    )}
                  />
                ))}
              </ul>

              {/* CORRECT ANSWER */}
              <div className="correct-answer">
                ✅ Correct Answer:{" "}
                <span
                  dangerouslySetInnerHTML={renderLatex(
                    q.correct
                  )}
                />
              </div>

              {/* ACTIONS */}
              <div className="card-actions">

                <button
                  className="btn-edit"
                  onClick={() => handleEdit(q)}
                >
                  ✏️ Edit
                </button>

                <button
                  className="btn-danger"
                  onClick={() =>
                    handleDelete(q.id)
                  }
                >
                  🗑 Delete
                </button>

              </div>
            </div>
          ))}

        </div>
      ) : (
        <div className="empty-state">
          <p>
            No questions added yet.
          </p>
        </div>
      )}
    </div>
  );
}

export default AdminPage;