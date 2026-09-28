import { useState } from 'react';
import ReviewCard from '../components/ReviewCard.jsx';
import ReviewDetail from './ReviewDetail.jsx';

export default function ReviewsList({ reviews }) {
  const [selectedId, setSelectedId] = useState(null);

  if (reviews.length === 0) {
    return (
      <div className="empty">
        <p style={{ fontSize: 18 }}>No reviews yet.</p>
        <p style={{ fontSize: 14, marginTop: 8 }}>
          Open a PR on a connected repo to see it here.
        </p>
      </div>
    );
  }

  return (
    <>
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} onOpen={() => setSelectedId(r.id)} />
      ))}

      {selectedId && (
        <ReviewDetail id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}