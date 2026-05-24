import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { submitReview, type ReviewPayload } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  reviewedId: number;
  reviewedName: string;
  jobTitle: string;
  onSuccess?: () => void;
};

export function ReviewDialog({
  open,
  onOpenChange,
  jobId,
  reviewedId,
  reviewedName,
  jobTitle,
  onSuccess,
}: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: (payload: ReviewPayload) => submitReview(payload),
    onSuccess: () => {
      toast.success("Reseña publicada");
      setRating(0);
      setComment("");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSubmit() {
    if (rating === 0) {
      toast.error("Selecciona una calificación");
      return;
    }
    mutation.mutate({
      job_id: jobId,
      reviewed_id: reviewedId,
      rating,
      comment: comment.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calificar a {reviewedName}</DialogTitle>
          <DialogDescription>
            Proyecto: {jobTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <p className="text-sm font-medium">Calificación</p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="rounded p-0.5 transition hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 transition ${
                      star <= (hover || rating)
                        ? "fill-primary-glow text-primary-glow"
                        : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 self-center text-sm text-muted-foreground">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Comentario (opcional)</p>
            <Textarea
              className="mt-2"
              rows={3}
              placeholder="Describe tu experiencia trabajando con este talento..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              disabled={mutation.isPending}
            />
          </div>

          <Button
            className="w-full bg-gradient-primary"
            disabled={rating === 0 || mutation.isPending}
            onClick={handleSubmit}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Star className="mr-2 h-4 w-4" />
            )}
            {mutation.isPending ? "Publicando..." : "Publicar reseña"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
