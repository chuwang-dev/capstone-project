import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/status');
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }
        const data = await response.json();
        setStatus(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Simple CI/CD Application</h1>
        <p>Welcome to the CI/CD deployment demo</p>
      </header>

      <main className="App-main">
        <section className="status-section">
          <h2>Server Status</h2>
          {loading && <p className="loading">Loading status...</p>}
          {error && <p className="error">Error: {error}</p>}
          {status && (
            <div className="status-card">
              <div className="status-item">
                <span className="label">Status:</span>
                <span className={`value ${status.status}`}>{status.status}</span>
              </div>
              <div className="status-item">
                <span className="label">Environment:</span>
                <span className="value">{status.environment}</span>
              </div>
              <div className="status-item">
                <span className="label">Version:</span>
                <span className="value">{status.version}</span>
              </div>
              <div className="status-item">
                <span className="label">Timestamp:</span>
                <span className="value">{new Date(status.timestamp).toLocaleString()}</span>
              </div>
            </div>
          )}
        </section>

        <section className="features-section">
          <h2>Features</h2>
          <ul>
            <li>✅ Automated CI/CD Pipeline (GitHub Actions)</li>
            <li>✅ Docker Containerization</li>
            <li>✅ Automated Deployment to VM</li>
            <li>✅ Health Checks and Monitoring</li>
            <li>✅ Security Best Practices</li>
          </ul>
        </section>

        <section className="info-section">
          <h2>Deployment Information</h2>
          <div className="info-card">
            <p><strong>Framework:</strong> React + Node.js Express</p>
            <p><strong>CI/CD:</strong> GitHub Actions</p>
            <p><strong>Container:</strong> Docker</p>
            <p><strong>Deployment Target:</strong> EC2 / Azure VM</p>
          </div>
        </section>
      </main>

      <footer className="App-footer">
        <p>&copy; 2026 Simple CI/CD App - Production Ready Deployment</p>
      </footer>
    </div>
  );
}

export default App;
