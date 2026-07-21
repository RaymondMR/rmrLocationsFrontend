import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { LocationCollection } from "@/types/models";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

export function useUserCollections() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery({
    queryKey: ["collections", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await api.get<LocationCollection[]>(`/api/collection/user/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
}

export function useCollection(id: string | undefined) {
  return useQuery({
    queryKey: ["collections", "detail", id],
    queryFn: async () => {
      const { data } = await api.get<LocationCollection>(`/api/collection/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  return useMutation({
    mutationFn: async (body: { name: string; description?: string; visibility: string }) => {
      const { data } = await api.post<LocationCollection>("/api/collection", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections", userId] });
      toast.success("Colección creada");
    },
  });
}

export function useUpdateCollection() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      description?: string;
      visibility?: string;
    }) => {
      await api.put(`/api/collection/${id}`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections", userId] });
      qc.invalidateQueries({ queryKey: ["collections", "detail"] });
      toast.success("Colección actualizada");
    },
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/collection/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections", userId] });
      toast.success("Colección eliminada");
    },
  });
}

export function useAddToCollection() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  return useMutation({
    mutationFn: async ({
      collectionId,
      locationId,
      notes,
    }: {
      collectionId: string;
      locationId: string;
      notes?: string;
    }) => {
      await api.post(`/api/collection/${collectionId}/items`, { locationId, notes });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections", userId] });
      qc.invalidateQueries({ queryKey: ["collections", "detail"] });
      toast.success("Guardado en la colección");
    },
  });
}

export function useRemoveFromCollection() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  return useMutation({
    mutationFn: async ({
      collectionId,
      locationId,
    }: {
      collectionId: string;
      locationId: string;
    }) => {
      await api.delete(`/api/collection/${collectionId}/items/${locationId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections", userId] });
      qc.invalidateQueries({ queryKey: ["collections", "detail"] });
      toast.success("Quitado de la colección");
    },
  });
}
