import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Review } from "@/types/models";
import { toast } from "sonner";

export function useReviews(locationId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", locationId],
    queryFn: async () => {
      const { data } = await api.get<Review[]>(`/api/review/location/${locationId}`);
      return data;
    },
    enabled: !!locationId,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      locationId: string;
      rating: number;
      title?: string;
      body?: string;
      visitedOn?: string;
    }) => {
      const { data } = await api.post<Review>("/api/review", body);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["reviews", vars.locationId] });
      qc.invalidateQueries({ queryKey: ["locations"] });
      qc.invalidateQueries({ queryKey: ["locations", vars.locationId] });
      toast.success("Reseña publicada");
    },
  });
}

export function useUpdateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      locationId,
      ...body
    }: {
      id: string;
      locationId: string;
      rating?: number;
      title?: string;
      body?: string;
      visitedOn?: string;
    }) => {
      await api.put(`/api/review/${id}`, body);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["reviews", vars.locationId] });
      qc.invalidateQueries({ queryKey: ["locations"] });
      qc.invalidateQueries({ queryKey: ["locations", vars.locationId] });
      toast.success("Reseña actualizada");
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, locationId }: { id: string; locationId: string }) => {
      await api.delete(`/api/review/${id}`);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["reviews", vars.locationId] });
      qc.invalidateQueries({ queryKey: ["locations"] });
      qc.invalidateQueries({ queryKey: ["locations", vars.locationId] });
      toast.success("Reseña eliminada");
    },
  });
}
