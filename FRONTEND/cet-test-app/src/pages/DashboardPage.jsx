import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./DashboardPage.css";

function Dashboard() {
  // ===============================
  // State Management
  // ===============================
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    physicsCount: 0,
    chemistryCount: 0,
    mathCount: 0,
  });

  const navigate = useNavigate();

  // ===============================
  // Fetch Questions on Load
  // ===============================
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get("http://localhost:8000/questions");
        setQuestions(response.data);

        // Calculate statistics
        let physicsCount = 0;
        let chemistryCount = 0;
        let mathCount = 0;

        response.data.forEach((q) => {
          if (q.subject === "Physics") physicsCount++;
          else if (q.subject === "Chemistry") chemistryCount++;
          else if (q.subject === "Mathematics") mathCount++;
        });

        setStats({
          totalQuestions: response.data.length,
          physicsCount,
          chemistryCount,
          mathCount,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // ===============================
  // Handle Start Test
  // ===============================
  const handleStartTest = () => {
    if (stats.totalQuestions === 0) {
      alert("No questions available. Admin needs to add questions first.");
      return;
    }
    setShowConfirmation(true);
  };

  // ===============================
  // Confirm Test Start
  // ===============================
  const handleConfirmStart = () => {
    setShowConfirmation(false);
    navigate("/");
  };

  // ===============================
  // Cancel Test Start
  // ===============================
  const handleCancelStart = () => {
    setShowConfirmation(false);
  };

  // ===============================
  // Navigate to Admin
  // ===============================
  const handleAdminAccess = () => {
    navigate("/admin-login");
  };

  // ===============================
  // Loading State
  // ===============================
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading test information...</p>
        </div>
      </div>
    );
  }

  // ===============================
  // Main UI
  // ===============================
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">📚 MHT-CET Test Platform</h1>
          <p className="dashboard-subtitle">
            Prepare for your entrance examination
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Welcome Section */}
        <section className="welcome-section">
          <div className="welcome-card">
            <div className="welcome-icon">👋</div>
            <h2>Welcome to MHT-CET Test</h2>
            <p>
              This platform helps you prepare for the Maharashtra Health Test - Common Entrance Test (MHT-CET).
              Test your knowledge with our comprehensive question bank covering Physics, Chemistry, and Mathematics.
            </p>
          </div>
        </section>

        {/* Test Statistics */}
        <section className="stats-section">
          <h3 className="section-title">📊 Test Statistics</h3>
          <div className="stats-grid">
            {/* Total Questions */}
            <div className="stat-card total">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalQuestions}</div>
                <div className="stat-label">Total Questions</div>
              </div>
            </div>

            {/* Physics */}
            <div className="stat-card physics">
              <div className="stat-icon">⚛️</div>
              <div className="stat-content">
                <div className="stat-value">{stats.physicsCount}</div>
                <div className="stat-label">Physics Questions</div>
              </div>
            </div>

            {/* Chemistry */}
            <div className="stat-card chemistry">
              <div className="stat-icon">🧪</div>
              <div className="stat-content">
                <div className="stat-value">{stats.chemistryCount}</div>
                <div className="stat-label">Chemistry Questions</div>
              </div>
            </div>

            {/* Mathematics */}
            <div className="stat-card math">
              <div className="stat-icon">📐</div>
              <div className="stat-content">
                <div className="stat-value">{stats.mathCount}</div>
                <div className="stat-label">Mathematics Questions</div>
              </div>
            </div>
          </div>
        </section>

        {/* Test Info */}
        <section className="info-section">
          <h3 className="section-title">ℹ️ Test Information</h3>
          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">⏱️</div>
              <h4>Duration</h4>
              <p>
                <strong>Physics + Chemistry:</strong> 60 minutes<br/>
                <strong>Mathematics:</strong> 45 minutes
              </p>
            </div>

            <div className="info-card">
              <div className="info-icon">⭐</div>
              <h4>Scoring</h4>
              <p>
                <strong>Physics:</strong> +1 mark per question<br/>
                <strong>Chemistry:</strong> +1 mark per question<br/>
                <strong>Mathematics:</strong> +2 marks per question
              </p>
            </div>

            <div className="info-card">
              <div className="info-icon">✅</div>
              <h4>How it Works</h4>
              <p>
                Answer all questions, mark for review if needed,
                and submit your test when ready.
              </p>
            </div>
          </div>
        </section>

        {/* Start Test Section */}
        <section className="action-section">
          <button
            className="btn-start-test"
            onClick={handleStartTest}
            disabled={stats.totalQuestions === 0}
          >
            <span className="btn-icon">🚀</span>
            <span className="btn-text">Start Test</span>
          </button>

          {stats.totalQuestions === 0 && (
            <p className="warning-message">
              ⚠️ No questions available. Please ask the administrator to add questions.
            </p>
          )}

          <button
            className="btn-admin-access"
            onClick={handleAdminAccess}
          >
            Admin Access
          </button>
        </section>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <h2>⚠️ Confirm Test Start</h2>
              <button
                className="modal-close"
                onClick={handleCancelStart}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p>
                You are about to start the MHT-CET test. Once you start, the timer will begin and you cannot pause it.
              </p>
              <div className="confirmation-details">
                <div className="detail-item">
                  <span className="detail-label">Total Questions:</span>
                  <span className="detail-value">{stats.totalQuestions}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Time:</span>
                  <span className="detail-value">105 minutes</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Sections:</span>
                  <span className="detail-value">2 (PC + Math)</span>
                </div>
              </div>
              <p className="confirmation-warning">
                Make sure you are ready to take the test before proceeding.
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={handleCancelStart}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={handleConfirmStart}
              >
                Start Test Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>
          © 2024 MHT-CET Test Platform. All rights reserved. | 
          <span> Good luck with your preparation! 📚</span>
        </p>
      </footer>
    </div>
  );
}

export default Dashboard;