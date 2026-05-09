import { useLocation } from "react-router-dom";
import katex from "katex";
import "katex/dist/katex.min.css";

// 🔥 helper to render latex safely
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

function Result() {
  const location = useLocation();
  const questions = location.state?.questions || [];

  if (questions.length === 0) {
    return <h2 style={{ padding: "20px" }}>No Result Data Found</h2>;
  }

  const score = questions.filter(
    (q) => q.selected === q.correct
  ).length;

  const percentage = ((score / questions.length) * 100).toFixed(1);

  return (
    <div
      style={{
        padding: "30px",
        background: "#f5f7fb",
        minHeight: "100vh",
        fontFamily: "Arial",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          marginBottom: "25px",
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>Test Result</h2>

        <h1
          style={{
            margin: "10px 0",
            color: score > questions.length / 2 ? "green" : "red",
          }}
        >
          {score} / {questions.length}
        </h1>

        <p style={{ fontSize: "18px" }}>Score: {percentage}%</p>
      </div>

      {/* QUESTIONS REVIEW */}
      {questions.map((q, index) => {
        const isCorrect = q.selected === q.correct;

        return (
          <div
            key={q.id}
            style={{
              background: "white",
              padding: "20px",
              marginBottom: "15px",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            {/* QUESTION */}
            <p style={{ fontWeight: "bold" }}>
              Q{index + 1}.
              <span
                dangerouslySetInnerHTML={renderLatex(q.question)}
              />
            </p>

            {/* OPTIONS */}
            {q.options.map((opt, i) => {
              let bg = "#eee";

              if (opt === q.correct) bg = "#c8f7c5"; // correct
              if (opt === q.selected && opt !== q.correct)
                bg = "#f7c5c5"; // wrong

              return (
                <div
                  key={i}
                  style={{
                    padding: "10px",
                    margin: "6px 0",
                    borderRadius: "6px",
                    background: bg,
                  }}
                >
                  <span
                    dangerouslySetInnerHTML={renderLatex(opt)}
                  />
                </div>
              );
            })}

            {/* ANSWER */}
            <p>
              Your Answer:{" "}
              <b style={{ color: isCorrect ? "green" : "red" }}>
                {q.selected ? (
                  <span
                    dangerouslySetInnerHTML={renderLatex(q.selected)}
                  />
                ) : (
                  "Not Attempted"
                )}
              </b>
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default Result;