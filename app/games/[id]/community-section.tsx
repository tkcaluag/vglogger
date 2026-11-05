import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type RatingRow = {
  rating: number | string | null;
};

type CommunityReview = {
  status: string;
  rating: number | string | null;
  review: string;
  created_at: string;
  profiles: { username: string } | { username: string }[] | null;
};

const RATING_BUCKETS = Array.from({ length: 10 }, (_, index) => (index + 1) / 2);

function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function CommunityLoading() {
  return (
    <section
      className="community-section reviews-section"
      aria-labelledby="community-heading"
      aria-busy="true"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">From the community</p>
          <h2 id="community-heading">Community</h2>
        </div>
      </div>
      <div className="community-skeleton" role="status">
        <p className="community-skeleton-label">
          Loading community ratings and reviews...
        </p>
        <span className="community-skeleton-line" />
        <span className="community-skeleton-line community-skeleton-line--short" />
        <span className="community-skeleton-card" />
        <span className="community-skeleton-card" />
      </div>
    </section>
  );
}

export default async function GameCommunity({ gameId }: { gameId: number }) {
  const supabase = await createClient();
  const [ratingsResult, reviewsResult] = await Promise.all([
    supabase
      .from("logs")
      .select("rating")
      .eq("game_id", gameId)
      .not("rating", "is", null),
    supabase
      .from("logs")
      .select("status, rating, review, created_at, profiles(username)")
      .eq("game_id", gameId)
      .not("review", "is", null)
      .neq("review", "")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (ratingsResult.error) throw ratingsResult.error;
  if (reviewsResult.error) throw reviewsResult.error;

  const ratings = ((ratingsResult.data ?? []) as RatingRow[]).filter(
    (row) => row.rating !== null,
  );
  const averageRating = ratings.length
    ? ratings.reduce((total, row) => total + Number(row.rating), 0) / ratings.length
    : null;
  const distribution = RATING_BUCKETS.map((rating) => ({
    rating,
    count: ratings.filter((row) => Number(row.rating) === rating).length,
  }));
  const reviews = ((reviewsResult.data ?? []) as CommunityReview[]).filter(
    (review) => review.review.trim().length > 0,
  );

  return (
    <section
      className="community-section reviews-section"
      aria-labelledby="community-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">From the community</p>
          <h2 id="community-heading">Community</h2>
        </div>
      </div>

      <div className="community-rating-summary">
        <div>
          <p className="community-stat-label">Average rating</p>
          <p className="community-average">
            {averageRating === null ? "—" : averageRating.toFixed(1)}
            <span> / 5</span>
          </p>
          <p className="community-rating-count">
            {ratings.length} {ratings.length === 1 ? "rating" : "ratings"}
          </p>
        </div>
        <div
          className="rating-distribution"
          aria-label="Rating distribution"
        >
          {distribution.map(({ rating, count }) => {
            const percentage = ratings.length ? (count / ratings.length) * 100 : 0;
            return (
              <div
                className="rating-distribution-row"
                key={rating}
                aria-label={`${rating.toFixed(1)} stars: ${count} ${
                  count === 1 ? "rating" : "ratings"
                }`}
              >
                <span>{rating.toFixed(1)}</span>
                <span className="rating-distribution-track" aria-hidden="true">
                  <span style={{ width: `${percentage}%` }} />
                </span>
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="community-reviews">
        <div className="community-subheading">
          <h3>Recent reviews</h3>
          {reviews.length ? <span>Up to 10</span> : null}
        </div>
        {reviews.length ? (
          <ul className="review-list">
            {reviews.map((review, index) => {
              const profile = Array.isArray(review.profiles)
                ? review.profiles[0]
                : review.profiles;
              const username = profile?.username;
              const date = new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeZone: "UTC",
              }).format(new Date(review.created_at));

              return (
                <li className="review-card" key={`${review.created_at}-${index}`}>
                  <div className="review-meta">
                    {username ? (
                      <Link href={`/u/${encodeURIComponent(username)}`}>
                        {username}
                      </Link>
                    ) : (
                      <strong>Player</strong>
                    )}
                    <span>
                      {review.rating === null
                        ? "No rating"
                        : `${Number(review.rating).toFixed(1)} / 5`}
                    </span>
                    <span>{getStatusLabel(review.status)}</span>
                    <time dateTime={review.created_at}>{date}</time>
                  </div>
                  <p>{review.review.trim()}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="no-reviews">
            No reviews yet. Be the first to share what you think about this game.
          </p>
        )}
      </div>
    </section>
  );
}
