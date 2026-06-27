import { useLocation, useNavigate } from "react-router-dom";
import katex from "katex";
import "katex/dist/katex.min.css";
import "./ResultPage.css";

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

// ===============================
// Score Card Component
// ===============================
function ScoreCard({ score, total, percentage }) {
  const performanceLevel = {
    excellent: percentage >= 80,
    good: percentage >= 60,
    average: percentage >= 40,
    poor: percentage < 40,
  };

  const getPerformanceText = () => {
    if (performanceLevel.excellent) return "Excellent! 🎉";
    if (performanceLevel.good) return "Very Good! 👏";
    if (performanceLevel.average) return "Good Effort! 📚";
    return "Keep Practicing! 💪";
  };

  return (
    <div className="result-header">
      <h2>Your Test Result</h2>
      <h1>{score}/{total}</h1>
      <p>Score: {percentage}%</p>

      <div className="score-stats">
        <div className="stat-item">
          <label>Correct</label>
          <span className="value" style={{ color: "#10b981" }}>
            {score}
          </span>
        </div>
        <div className="stat-item">
          <label>Incorrect</label>
          <span className="value" style={{ color: "#ef4444" }}>
            {total - score}
          </span>
        </div>
        <div className="stat-item">
          <label>Accuracy</label>
          <span className="value" style={{ color: "#2563eb" }}>
            {percentage}%
          </span>
        </div>
      </div>

      <div className="performance-bar">
        <div className="performance-label">
          <span>{getPerformanceText()}</span>
          <span style={{ fontWeight: "700", color: "#2563eb" }}>
            {percentage}%
          </span>
        </div>
        <div className="performance-fill">
          <div
            className="performance-progress"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ===============================
// Question Card Component
// ===============================
function QuestionCard({ question, index, total }) {
  const isCorrect = question.selected === question.correct;
  const isUnattempted = !question.selected;

  const cardClass = isUnattempted
    ? "unattempted"
    : isCorrect
    ? "correct"
    : "incorrect";

  const statusClass = isUnattempted
    ? "unattempted"
    : isCorrect
    ? "correct"
    : "incorrect";

  const statusIcon = isUnattempted ? "⚠" : isCorrect ? "✓" : "✗";
  const statusText = isUnattempted
    ? "Not Attempted"
    : isCorrect
    ? "Correct Answer"
    : "Incorrect Answer";

  return (
    <div className={`question-card ${cardClass}`}>
      <span className="question-number">Q{index + 1}/{total}</span>

      <div className="question-text">
        {/* IMAGE QUESTION */}
        {question.has_image && question.image_url && (
          <div style={{ marginBottom: "15px" }}>
            <img
              src={`http://127.0.0.1:8000${question.image_url}`}
              alt="Question"
              style={{
                maxWidth: "100%",
                maxHeight: "350px",
                borderRadius: "10px",
                border: "1px solid #ddd",
              }}
            />
          </div>
        )}

        {/* QUESTION TEXT */}
        {question.question && (
          <span
            dangerouslySetInnerHTML={renderLatex(question.question)}
          />
        )}

      </div>

      <div className="options-container">
        {question.options.map((opt, i) => {
          let optionClass = "neutral";

          if (opt === question.correct) {
            optionClass = "correct";
          } else if (opt === question.selected && opt !== question.correct) {
            optionClass = "incorrect";
          }

          return (
            <div key={i} className={`option-item ${optionClass}`}>
              <p dangerouslySetInnerHTML={renderLatex(opt)} />
            </div>
          );
        })}
      </div>

      <div className={`answer-status ${statusClass}`}>
        <div className="answer-status-icon">{statusIcon}</div>
        <div>
          <p>{statusText}</p>
          <strong
            className={
              isUnattempted
                ? "unattempted-answer"
                : isCorrect
                ? "correct-answer"
                : "wrong-answer"
            }
          >
            {isUnattempted ? (
              "You did not select any answer"
            ) : (
              <>
                Your answer:{" "}
                <span dangerouslySetInnerHTML={renderLatex(question.selected)} />
              </>
            )}
          </strong>
          {!isCorrect && !isUnattempted && (
            <strong style={{ color: "#10b981", marginTop: "8px" }}>
              Correct answer:{" "}
              <span dangerouslySetInnerHTML={renderLatex(question.correct)} />
            </strong>
          )}
        </div>
      </div>
    </div>
  );
}

// ===============================
// Stats Summary Component
// ===============================
function StatsSummary({ questions }) {
  const totalQuestions = questions.length;
  const answered = questions.filter((q) => q.selected).length;
  const correct = questions.filter((q) => q.selected === q.correct).length;
  const incorrect = answered - correct;
  const unattempted = totalQuestions - answered;

  return (
    <div style={{ marginBottom: "var(--space-2xl)" }}>
      <h3 style={{ marginBottom: "var(--space-lg)", color: "var(--neutral-800)" }}>
        📊 Summary
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "var(--space-lg)",
        }}
      >
        {[
          { label: "Total Questions", value: totalQuestions, color: "#2563eb" },
          { label: "Answered", value: answered, color: "#3b82f6" },
          { label: "Correct", value: correct, color: "#10b981" },
          { label: "Incorrect", value: incorrect, color: "#ef4444" },
          { label: "Unattempted", value: unattempted, color: "#f59e0b" },
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: "linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)",
              padding: "var(--space-lg)",
              borderRadius: "var(--radius-lg)",
              textAlign: "center",
              border: "1px solid var(--neutral-200)",
            }}
          >
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--neutral-600)",
                marginBottom: "var(--space-sm)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {stat.label}
            </p>
            <p
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: stat.color,
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===============================
// Main Result Component
// ===============================
function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const questions = location.state?.questions || [];

  if (questions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-content">
          <div className="empty-state-icon">⚠️</div>
          <h2>No Result Data Found</h2>
          <p>Please take a test first to see your results.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/")}
            style={{ marginTop: "var(--space-xl)" }}
          >
            Back to Test
          </button>
        </div>
      </div>
    );
  }

  const score = questions.filter((q) => q.selected === q.correct).length;
  const percentage = ((score / questions.length) * 100).toFixed(1);

  return (
    <div className="result-container">
      <div className="result-wrapper">
        {/* Header with Score */}
        <ScoreCard score={score} total={questions.length} percentage={percentage} />

        {/* Summary Stats */}
        <StatsSummary questions={questions} />

        {/* Questions Review */}
        <div className="questions-review">
          <h3>Detailed Review</h3>

          {questions.map((q, index) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={index}
              total={questions.length}
            />
          ))}
        </div>

        {/* Footer with Actions */}
        <div className="result-footer">
          <h3>What Next?</h3>
          <p style={{ color: "var(--neutral-600)", marginBottom: "var(--space-lg)" }}>
            {score >= questions.length * 0.8
              ? "Great job! You've mastered this topic. Try more challenging tests!"
              : score >= questions.length * 0.6
              ? "Good progress! Review the incorrect answers to improve."
              : "Keep practicing! Go through the concepts and try again."}
          </p>
          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/")}
            >
              Retake Test
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => window.print()}
            >
              Print Results
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}

export default Result;