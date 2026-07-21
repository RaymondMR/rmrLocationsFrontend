import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { LocationMedia } from "@/types/models";
import { toast } from "sonner";

export function useMedia(locationId: string | undefined) {
  return useQuery({
    queryKey: ["media", locationId],
    queryFn: async () => {
      const { data } = await api.get<LocationMedia[]>(`/api/media/location/${locationId}`);
      return data;
    },
    enabled: !!locationId,
  });
}

export function useCreateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      locationId: string;
      url: string;
      thumbnailUrl?: string;
      caption?: string;
      type: "Image" | "Video";
      isCover: boolean;
      sortOrder: number;
    }) => {
      const { data } = await api.post<LocationMedia>("/api/media", body);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["media", vars.locationId] });
      qc.invalidateQueries({ queryKey: ["locations", vars.locationId] });
      toast.success("Media agregado");
    },
  });
}

export function useUpdateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      locationId,
      ...body
    }: {
      id: string;
      locationId: string;
      url?: string;
      thumbnailUrl?: string;
      caption?: string;
      type?: "Image" | "Video";
      isCover?: boolean;
      sortOrder?: number;
    }) => {
      await api.put(`/api/media/${id}`, body);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["media", vars.locationId] });
      qc.invalidateQueries({ queryKey: ["locations", vars.locationId] });
      toast.success("Media actualizado");
    },
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, locationId }: { id: string; locationId: string }) => {
      await api.delete(`/api/media/${id}`);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["media", vars.locationId] });
      qc.invalidateQueries({ queryKey: ["locations", vars.locationId] });
      toast.success("Media eliminado");
    },
  });
}
