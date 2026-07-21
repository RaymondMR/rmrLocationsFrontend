import type { Review } from "@/types/models";
import ReviewCard from "./ReviewCard";
import EmptyState from "@/components/shared/EmptyState";
import { MessageSquareText } from "lucide-react";

interface ReviewListProps {
  reviews: Review[];
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
}

export default function ReviewList({ reviews, onEdit, onDelete }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquareText size={48} />}
        title="Aún no hay reseñas"
        description="Sé el primero en contar cómo te fue."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
