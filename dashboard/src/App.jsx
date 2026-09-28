import { useQuery } from '@tanstack/react-query';
import ReviewsList from './pages/ReviewsList.jsx';

async function fetchReviews() {
  const res = await fetch('/api/reviews?limit=50');
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

export default function App() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reviews'],
    queryFn: fetchReviews,
  });

  return (
    <div>
      <header>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1>🤖 AI PR Reviewer</h1>
            <p>Review history</p>
          </div>
          <a
            href="https://github.com/hitheesha10/ai-pr-reviewer"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 14 }}
          >
            GitHub ↗
          </a>
        </div>
      </header>

      <main>
        {isLoading && <p className="loading">Loading…</p>}
        {error && <p className="error">Error: {error.message}</p>}
        {data && <ReviewsList reviews={data.reviews} />}
      </main>
    </div>
  );
}