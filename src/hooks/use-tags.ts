import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Tag } from "@/types/models";
import { toast } from "sonner";

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data } = await api.get<Tag[]>("/api/tag");
      return data;
    },
  });
}

export function useTag(id: string | undefined) {
  return useQuery({
    queryKey: ["tags", id],
    queryFn: async () => {
      const { data } = await api.get<Tag>(`/api/tag/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; slug: string; description?: string }) => {
      const { data } = await api.post<Tag>("/api/tag", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag creado");
    },
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; slug?: string; description?: string }) => {
      await api.put(`/api/tag/${id}`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag actualizado");
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/tag/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag eliminado");
    },
  });
}
