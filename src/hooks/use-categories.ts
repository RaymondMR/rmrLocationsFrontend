import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Category } from "@/types/models";
import { toast } from "sonner";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<Category[]>("/api/category");
      return data;
    },
  });
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: ["categories", id],
    queryFn: async () => {
      const { data } = await api.get<Category>(`/api/category/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.post>[1]) => {
      const { data } = await api.post<Category>("/api/category", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría creada");
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, unknown>) => {
      await api.put(`/api/category/${id}`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría actualizada");
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/category/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría eliminada");
    },
  });
}
