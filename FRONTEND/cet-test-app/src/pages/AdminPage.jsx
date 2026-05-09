import { useState, useEffect } from "react";
import axios from "axios";
import katex from "katex";
import 'katex/dist/katex.min.css';

function AdminPage() {
  const [form, setForm] = useState({
    id: null,
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct: "",
  });

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

  const [questions, setQuestions] = useState([]);

  const fetchQuestions = () => {
    axios.get("http://127.0.0.1:8000/questions")
      .then(res => setQuestions(res.data));
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (form.id) {
        await axios.put(`http://127.0.0.1:8000/questions/${form.id}`, form);
        alert("Updated ✅");
      } else {
        await axios.post("http://127.0.0.1:8000/questions", form);
        alert("Added ✅");
      }

      setForm({
        id: null,
        question: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct: "",
      });

      fetchQuestions();
    } catch (err) {
      console.error(err);
      alert("Error ❌");
    }
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://127.0.0.1:8000/questions/${id}`);
    fetchQuestions();
  };

  const handleEdit = (q) => {
    setForm({
      id: q.id,
      question: q.question,
      option_a: q.options[0],
      option_b: q.options[1],
      option_c: q.options[2],
      option_d: q.options[3],
      correct: q.correct,
    });
  };

  return (
    <div style={{
      padding: "30px",
      background: "#f4f6fb",
      minHeight: "100vh",
      fontFamily: "Arial"
    }}>

      <h1 style={{ marginBottom: "20px" }}>Admin Panel</h1>

      {/* FORM CARD */}
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        marginBottom: "30px",
        maxWidth: "500px"
      }}>
        <h3>{form.id ? "Edit Question" : "Add Question"}</h3>

        <textarea
          name="question"
          placeholder="Enter Question"
          value={form.question}
          onChange={handleChange}
          style={{
            width: "100%",
            height: "80px",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        />

        {["option_a", "option_b", "option_c", "option_d"].map((opt, i) => (
          <input
            key={i}
            name={opt}
            placeholder={`Option ${String.fromCharCode(65 + i)}`}
            value={form[opt]}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc"
            }}
          />
        ))}

        <select
          name="correct"
          value={form.correct}
          onChange={(e) => {
            const selectedOption = e.target.value;

            let value = "";
            if (selectedOption === "A") value = form.option_a;
            if (selectedOption === "B") value = form.option_b;
            if (selectedOption === "C") value = form.option_c;
            if (selectedOption === "D") value = form.option_d;

            setForm({
              ...form,
              correct: value,
            });
          }}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            marginBottom: "10px"
          }}
        >
          <option value="">Select Correct Answer</option>
          <option value="A">Option A</option>
          <option value="B">Option B</option>
          <option value="C">Option C</option>
          <option value="D">Option D</option>
        </select>

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "10px",
            background: form.id ? "#ff9800" : "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          {form.id ? "Update Question" : "Add Question"}
        </button>
      </div>

      {/* QUESTION LIST */}
      <h2>All Questions</h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "15px"
      }}>
        {questions.map((q) => (
          <div
            key={q.id}
            style={{
              background: "white",
              padding: "15px",
              borderRadius: "10px",
            }}
          >
            {/* ✅ LaTeX Question */}
            <p
              style={{ fontWeight: "bold" }}
              dangerouslySetInnerHTML={renderLatex(q.question)}
            />

            {/* ✅ Options */}
            <ul>
              {q.options.map((opt, i) => (
                <li
                  key={i}
                  dangerouslySetInnerHTML={renderLatex(opt)}
                />
              ))}
            </ul>

            {/* ✅ Correct */}
            <p>
              Correct:{" "}
              <b
                style={{ color: "green" }}
                dangerouslySetInnerHTML={renderLatex(q.correct)}
              />
            </p>

            <button onClick={() => handleEdit(q)}>Edit</button>
            <button onClick={() => handleDelete(q.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPage;