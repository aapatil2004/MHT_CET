import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import katex from "katex";

import "katex/dist/katex.min.css";
import "./TestPage.css";

// =====================================
// Render Latex
// =====================================
function renderLatex(text) {
  try {
    return {
      __html: katex.renderToString(text || "", {
        throwOnError: false,
      }),
    };
  } catch {
    return { __html: text };
  }
}

// =====================================
// Get Status
// =====================================
function getStatus(q) {
  if (!q.selected && !q.markedForReview) return "NOT_ANSWERED";
  if (!q.selected && q.markedForReview) return "MARKED";
  if (q.selected && !q.markedForReview) return "ANSWERED";
  if (q.selected && q.markedForReview) return "ANSWERED_MARKED";
}

// =====================================
// Main Component
// =====================================
function TestPage() {

  // =====================================
  // States
  // =====================================
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentSection, setCurrentSection] = useState("PC");

  const [pcTimeLeft, setPcTimeLeft] = useState(10);
  const [mathTimeLeft, setMathTimeLeft] = useState(2700);

  const [currentIndex, setCurrentIndex] = useState(0);

  const navigate = useNavigate();

  // =====================================
  // Fetch Questions
  // =====================================
  useEffect(() => {

    axios
      .get("http://127.0.0.1:8000/questions")

      .then((res) => {

        console.log("QUESTIONS:", res.data);

        const formatted = res.data.map((q) => ({
          ...q,
          selected: null,
          markedForReview: false,
        }));

        setQuestions(formatted);
      })

      .catch((err) => {
        console.error("FETCH ERROR:", err);
      })

      .finally(() => {
        setLoading(false);
      });

  }, []);

  // =====================================
  // Separate Questions
  // =====================================
  const pcQuestions = questions.filter((q) =>
    ["physics", "chemistry"].includes(
      q.subject?.toLowerCase()
    )
  );

  const mathQuestions = questions.filter(
    (q) =>
      q.subject?.toLowerCase() === "mathematics"
  );

  const displayedQuestions =
    currentSection === "PC"
      ? pcQuestions
      : mathQuestions;

  const currentQuestion =
    displayedQuestions[currentIndex];

  // =====================================
  // Timer Logic
  // =====================================
  useEffect(() => {

    if (loading) return;

    // ========================
    // Physics + Chemistry
    // ========================
    if (currentSection === "PC") {

      if (pcTimeLeft <= 0) {
        setCurrentSection("MATH");
        setCurrentIndex(0);
        return;
      }

      const timer = setInterval(() => {
        setPcTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }

    // ========================
    // Mathematics
    // ========================
    if (currentSection === "MATH") {

      if (mathTimeLeft <= 0) {
        navigate("/result", {
          state: { questions },
        });
        return;
      }

      const timer = setInterval(() => {
        setMathTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }

  }, [
    currentSection,
    pcTimeLeft,
    mathTimeLeft,
    loading,
    navigate,
    questions,
  ]);

  // =====================================
  // Option Click
  // =====================================
  const handleOptionClick = (option) => {

    const id = currentQuestion.id;

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, selected: option }
          : q
      )
    );
  };

  // =====================================
  // Toggle Mark
  // =====================================
  const toggleMarkForReview = () => {

    const id = currentQuestion.id;

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              markedForReview:
                !q.markedForReview,
            }
          : q
      )
    );
  };

  // =====================================
  // Navigation
  // =====================================
  const nextQuestion = () => {
    if (
      currentIndex <
      displayedQuestions.length - 1
    ) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const jumpToQuestion = (index) => {
    setCurrentIndex(index);
  };

  // =====================================
  // Submit
  // =====================================
  const handleSubmit = () => {

    navigate("/result", {
      state: { questions },
    });
  };

  // =====================================
  // Loading
  // =====================================
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "24px",
        }}
      >
        Loading Questions...
      </div>
    );
  }

  // =====================================
  // No Questions
  // =====================================
  if (!currentQuestion) {

    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "24px",
          color: "red",
        }}
      >
        No Questions Found
      </div>
    );
  }

  // =====================================
  // Current Time
  // =====================================
  const currentTime =
    currentSection === "PC"
      ? pcTimeLeft
      : mathTimeLeft;

  // =====================================
  // UI
  // =====================================
  return (

    <div className="test-container">

      {/* ========================= */}
      {/* LEFT PANEL */}
      {/* ========================= */}
      <div>

        {/* HEADING */}
        <h2>
          {currentSection === "PC"
            ? "Physics + Chemistry"
            : "Mathematics"}
        </h2>

        {/* TIMER */}
        <div
          style={{
            marginBottom: "20px",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          ⏱ Time Left:
          {" "}
          {Math.floor(currentTime / 60)}
          :
          {String(currentTime % 60).padStart(2, "0")}
        </div>

        {/* PROGRESS */}
        <div style={{ marginBottom: "15px" }}>
          Question {currentIndex + 1}
          {" / "}
          {displayedQuestions.length}
        </div>

        {/* STATUS */}
        <div style={{ marginBottom: "20px" }}>
          Status:
          {" "}
          {getStatus(currentQuestion)}
        </div>

        {/* ================================= */}
        {/* IMAGE QUESTION */}
        {/* ================================= */}
        {currentQuestion.has_image &&
          currentQuestion.image_url && (

          <div style={{ marginBottom: "20px" }}>

            <img
              src={`http://127.0.0.1:8000${currentQuestion.image_url}`}
              alt="Question"
              style={{
                maxWidth: "100%",
                maxHeight: "350px",
                borderRadius: "10px",
                border: "1px solid #ccc",
              }}
            />

          </div>
        )}

        {/* ================================= */}
        {/* QUESTION */}
        {/* ================================= */}
        {currentQuestion.question && (

          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              background: "#fff",
              borderRadius: "10px",
              borderLeft: "4px solid #2563eb",
              fontSize: "18px",
            }}
            dangerouslySetInnerHTML={renderLatex(
              currentQuestion.question
            )}
          />

        )}

        {/* ================================= */}
        {/* OPTIONS */}
        {/* ================================= */}
        <div>

          {currentQuestion.options?.map(
            (opt, index) => (

              <button
                key={index}

                onClick={() =>
                  handleOptionClick(opt)
                }

                style={{
                  display: "block",
                  width: "100%",
                  padding: "15px",
                  marginBottom: "12px",
                  textAlign: "left",
                  borderRadius: "8px",
                  border:
                    currentQuestion.selected === opt
                      ? "2px solid green"
                      : "1px solid #ccc",

                  background:
                    currentQuestion.selected === opt
                      ? "#e8f5e9"
                      : "white",

                  cursor: "pointer",
                }}
              >

                <strong>
                  {String.fromCharCode(65 + index)}.
                </strong>

                {" "}

                <span
                  dangerouslySetInnerHTML={renderLatex(
                    opt
                  )}
                />

              </button>

            )
          )}

        </div>

        {/* ================================= */}
        {/* NAVIGATION */}
        {/* ================================= */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "20px",
          }}
        >

          <button
            onClick={prevQuestion}
            disabled={currentIndex === 0}
          >
            Back
          </button>

          <button
            onClick={nextQuestion}
            disabled={
              currentIndex ===
              displayedQuestions.length - 1
            }
          >
            Next
          </button>

          <button
            onClick={toggleMarkForReview}
          >
            {currentQuestion.markedForReview
              ? "Unmark"
              : "Mark"}
          </button>

        </div>

        {/* ================================= */}
        {/* SUBMIT */}
        {/* ================================= */}
        <button
          onClick={handleSubmit}
          style={{
            marginTop: "25px",
            width: "100%",
            padding: "15px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Submit Test
        </button>

      </div>

      {/* ========================= */}
      {/* RIGHT PANEL */}
      {/* ========================= */}
      <div>

        <h3>Question Palette</h3>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >

          {displayedQuestions.map(
            (q, index) => {

              const status =
                getStatus(q);

              let bg = "#ccc";

              if (status === "ANSWERED")
                bg = "green";

              if (status === "NOT_ANSWERED")
                bg = "red";

              if (status === "MARKED")
                bg = "orange";

              if (
                status ===
                "ANSWERED_MARKED"
              )
                bg = "purple";

              return (

                <button
                  key={q.id}

                  onClick={() =>
                    jumpToQuestion(index)
                  }

                  style={{
                    width: "45px",
                    height: "45px",
                    background: bg,
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {index + 1}
                </button>

              );
            }
          )}

        </div>

      </div>

    </div>
  );
}

export default TestPage;