import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function HistoryPanel() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/history`);
      if (!res.ok) throw new Error('Failed to load history.');
      const data = await res.json();
      setRecords(data);
    } catch (e) {
      setError(e.message || 'Could not connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  if (loading) {
    return (
      <div className="history-loading">
        <div className="spinner" />
        <span>Loading history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-error">
        <span>⚠ {error}</span>
        <button className="retry-btn" onClick={fetchHistory}>Retry</button>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="history-empty">
        <div className="empty-icon">🔬</div>
        <h3>No analyses yet</h3>
        <p>Upload a skin image to run your first analysis.</p>
      </div>
    );
  }

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>{records.length} Past {records.length === 1 ? 'Analysis' : 'Analyses'}</h3>
        <button className="refresh-btn" onClick={fetchHistory}>↻ Refresh</button>
      </div>
      <div className="history-grid">
        {records.map(rec => {
          return (
            <div key={rec.id} className="history-card">
              <div className="hcard-top">
                <div className="hcard-id"># {rec.id}</div>
              </div>

              <div className="hcard-class">{rec.predicted_class || '—'}</div>

              <div className="hcard-meta">
                <span>{rec.risk_level || 'Risk unavailable'}</span>
                {rec.confidence != null && (
                  <span className="hcard-conf">{rec.confidence.toFixed(1)}% confidence</span>
                )}
              </div>

              {/* Mini confidence bar */}
              {rec.confidence != null && (
                <div className="hcard-bar-track">
                  <div
                    className="hcard-bar-fill"
                    style={{
                      width: `${rec.confidence}%`,
                      background: '#18a58c',
                    }}
                  />
                </div>
              )}

              <div className="hcard-file">{rec.original_filename || 'unknown file'}</div>
              <div className="hcard-date">{formatDate(rec.analyzed_at)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
