import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Location, PagedResult, NearbyResult } from "@/types/models";

interface LocationFilters {
  name?: string;
  categoryId?: string;
  tagIds?: string;
  status?: string;
  sort?: "name" | "rating" | "recent";
  page?: number;
  pageSize?: number;
}

export function useLocations(filters: LocationFilters = {}) {
  return useQuery({
    queryKey: ["locations", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.name) params.set("name", filters.name);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.tagIds) params.set("tagIds", filters.tagIds);
      if (filters.status) params.set("status", filters.status);
      if (filters.sort) params.set("sort", filters.sort);
      params.set("page", String(filters.page ?? 1));
      params.set("pageSize", String(filters.pageSize ?? 20));
      const { data } = await api.get<PagedResult<Location>>(`/api/location?${params}`);
      return data;
    },
  });
}

export function useLocation(id: string | undefined) {
  return useQuery({
    queryKey: ["locations", id],
    queryFn: async () => {
      const { data } = await api.get<Location>(`/api/location/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useNearbyLocations(lat?: number, lng?: number, radiusMeters?: number) {
  return useQuery({
    queryKey: ["locations", "nearby", { lat, lng, r: radiusMeters }],
    queryFn: async () => {
      if (lat == null || lng == null) return [];
      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lng),
        radiusMeters: String(radiusMeters ?? 5000),
        take: "20",
      });
      const { data } = await api.get<NearbyResult[]>(`/api/location/nearby?${params}`);
      return data;
    },
    enabled: lat != null && lng != null,
  });
}

export function useSearchLocations(
  lat?: number,
  lng?: number,
  radiusMeters?: number,
  name?: string,
  categoryIds?: string,
  tagIds?: string
) {
  return useQuery({
    queryKey: ["locations", "search", { lat, lng, r: radiusMeters, name, categoryIds, tagIds }],
    queryFn: async () => {
      if (lat == null || lng == null) return [];
      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lng),
        radiusMeters: String(radiusMeters ?? 5000),
      });
      if (name) params.set("name", name);
      if (categoryIds) params.set("categoryIds", categoryIds);
      if (tagIds) params.set("tagIds", tagIds);
      const { data } = await api.get<Location[]>(`/api/location/search?${params}`);
      return data;
    },
    enabled: lat != null && lng != null,
  });
}
