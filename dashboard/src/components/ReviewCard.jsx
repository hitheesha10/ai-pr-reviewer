import StatusBadge from './StatusBadge.jsx';

function timeAgo(iso) {
  // SQLite datetime('now') returns UTC without timezone marker — append Z
  const diff = (Date.now() - new Date(iso + 'Z').getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ReviewCard({ review, onOpen }) {
  return (
    <button className="card" onClick={onOpen}>
      <div className="card-header">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="card-meta">
            <StatusBadge status={review.status} />
            <span style={{ marginLeft: 8 }}>
              {review.repo} #{review.pr_number}
            </span>
          </div>
          <p className="card-title">{review.pr_title}</p>
          <p className="card-sub">
            by {review.pr_author} · {timeAgo(review.created_at)}
          </p>
        </div>

        <div className="severity-counts">
          {review.high_count > 0 && (
            <span className="high">🔴 {review.high_count}</span>
          )}
          {review.medium_count > 0 && (
            <span className="medium">🟡 {review.medium_count}</span>
          )}
          {review.low_count > 0 && (
            <span className="low">🟢 {review.low_count}</span>
          )}
        </div>
      </div>
    </button>
  );
}