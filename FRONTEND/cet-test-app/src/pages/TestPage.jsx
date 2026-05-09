import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import katex from "katex";
import "katex/dist/katex.min.css";

// 🔹 Render LaTeX safely
function renderLatex(text) {
  try {
    return {
      __html: katex.renderToString(text, {
        throwOnError: false,
      }),
    };
  } catch {
    return { __html: text };
  }
}

// 🔹 Status logic
function getStatus(q) {
  if (!q.selected && !q.markedForReview) return "NOT_ANSWERED";
  if (!q.selected && q.markedForReview) return "MARKED";
  if (q.selected && !q.markedForReview) return "ANSWERED";
  if (q.selected && q.markedForReview) return "ANSWERED_MARKED";
}

function TestPage() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const Navigate = useNavigate();

  // 🔌 Fetch questions
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/questions")
      .then((res) => {
        const formatted = res.data.map((q) => ({
          ...q,
          selected: null,
          markedForReview: false,
        }));
        setQuestions(formatted);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // ⏱️ Timer
  useEffect(() => {
    if (submitted || loading) return;

    if (timeLeft <= 0) {
      Navigate("/result", {
      state: { questions },
    });
    return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted, loading]);

  

  const handleSubmit = () => {
    Navigate("/result", {
      state: { questions },
    })
  };

  // 🧮 Score
  const calculateScore = () => {
    return questions.filter((q) => q.selected === q.correct).length;
  };

  // ✅ Select option
  const handleOptionClick = (option) => {
    if (submitted) return;

    setQuestions((prev) =>
      prev.map((q, index) =>
        index === currentIndex ? { ...q, selected: option } : q
      )
    );
  };

  // 🔁 Toggle mark
  const toggleMarkForReview = () => {
    if (submitted) return;

    setQuestions((prev) =>
      prev.map((q, index) =>
        index === currentIndex
          ? { ...q, markedForReview: !q.markedForReview }
          : q
      )
    );
  };

  // Navigation
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // ⏳ Loading
  if (loading) return <h3>Loading questions...</h3>;

  const currentQuestion = questions[currentIndex];

  // 🧪 TEST PAGE
  return (
    <div style={{ display: "flex", height: "100vh" }}>
  
  {/* LEFT SIDE */}
  <div style={{ flex: 3, padding: "20px" }}>
    <h3>⏱ Time Left: {timeLeft}s</h3>

    <h2>Question {currentIndex + 1}</h2>

    <div
      style={{ marginBottom: "20px", fontSize: "18px" }}
      dangerouslySetInnerHTML={renderLatex(currentQuestion.question)}
    />

    {/* Options */}
    {currentQuestion.options.map((opt, index) => (
      <button
        key={index}
        onClick={() => handleOptionClick(opt)}
        style={{
          display: "block",
          margin: "10px 0",
          padding: "12px",
          width: "100%",
          textAlign: "left",
          borderRadius: "8px",
          border: "1px solid #ccc",
          background:
            currentQuestion.selected === opt ? "#d4edda" : "white",
          cursor: "pointer",
        }}
      >
        <span dangerouslySetInnerHTML={renderLatex(opt)} />
      </button>
    ))}

    {/* Actions */}
    <div style={{ marginTop: "20px" }}>
      <button onClick={prevQuestion}>Back</button>
      <button onClick={nextQuestion} style={{ marginLeft: "10px" }}>
        Next
      </button>
      <button
        onClick={toggleMarkForReview}
        style={{ marginLeft: "10px" }}
      >
        {currentQuestion.markedForReview
          ? "Unmark"
          : "Mark for Review"}
      </button>
    </div>

    <button
      onClick={handleSubmit}
      style={{ marginTop: "20px", background: "red", color: "white" }}
    >
      Submit Test
    </button>
  </div>

  {/* RIGHT SIDE (Palette) */}
  <div
    style={{
      flex: 1,
      borderLeft: "2px solid #eee",
      padding: "20px",
      background: "#f9f9f9",
    }}
  >
    <h3>Questions</h3>

    {questions.map((q, index) => {
      const status = getStatus(q);

      let color = "#ccc";
      if (status === "ANSWERED") color = "#28a745";
      if (status === "NOT_ANSWERED") color = "#dc3545";
      if (status === "MARKED") color = "#ffc107";
      if (status === "ANSWERED_MARKED") color = "#6f42c1";

      return (
        <button
          key={q.id}
          onClick={() => setCurrentIndex(index)}
          style={{
            margin: "5px",
            background: color,
            color: "white",
            width: "40px",
            height: "40px",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {index + 1}
        </button>
      );
    })}
  </div>
</div>
  );
}

export default TestPage;