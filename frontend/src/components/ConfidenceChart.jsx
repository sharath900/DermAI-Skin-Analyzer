export default function ConfidenceChart({ scores }) {
  if (!scores || scores.length === 0) return null;

  return (
    <div className="confidence-chart">
      <h4 className="chart-title">AI Confidence Breakdown</h4>
      <div className="chart-bars">
        {scores.map((item, i) => {
          const confidence = Number(item.confidence) || 0;
          return (
            <div key={item.class_code || item.class_name || i} className="chart-row">
              <div className="chart-row-header">
                <span className="chart-label">{item.class_name || item.class_code}</span>
                <div className="chart-meta">
                  <span className="chart-pct">{confidence.toFixed(1)}%</span>
                </div>
              </div>
              <div className="chart-track">
                <div
                  className="chart-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, confidence))}%`,
                    background: item.color || '#18a58c',
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
