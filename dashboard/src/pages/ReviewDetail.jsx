import { useQuery } from '@tanstack/react-query';
import FindingItem from '../components/FindingItem.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

async function fetchReview(id) {
  const res = await fetch(`/api/reviews/${id}`);
  if (!res.ok) throw new Error('Failed to fetch review');
  return res.json();
}

export default function ReviewDetail({ id, onClose }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['review', id],
    queryFn: () => fetchReview(id),
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ margin: 0, fontSize: 16 }}>Review #{id}</h2>
          <button className="close-btn" onClick={onClose}>
            Close ✕
          </button>
        </div>

        <div className="modal-body">
          {isLoading && <p className="loading">Loading…</p>}
          {error && <p className="error">Error: {error.message}</p>}

          {data && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div className="card-meta" style={{ marginBottom: 4 }}>
                  <StatusBadge status={data.status} />
                  <span style={{ marginLeft: 8 }}>
                    {data.repo} #{data.pr_number}
                  </span>
                </div>

                <p style={{ margin: '4px 0', fontSize: 14 }}>{data.pr_title}</p>

                <p className="card-sub">
                  by {data.pr_author} · SHA {data.head_sha?.slice(0, 7)}
                </p>

                {data.github_review_id && (
                  <a
                    href={`https://github.com/${data.repo}/pull/${data.pr_number}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, display: 'inline-block', marginTop: 6 }}
                  >
                    View on GitHub ↗
                  </a>
                )}

                {data.error && (
                  <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>
                    Error: {data.error}
                  </p>
                )}
              </div>

              <h3
                style={{
                  fontSize: 13,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  margin: '0 0 8px',
                }}
              >
                Findings ({data.findings.length})
              </h3>

              {data.findings.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  No findings recorded.
                </p>
              ) : (
                <div>
                  {data.findings.map((f) => (
                    <FindingItem key={f.id} finding={f} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}