import { useState, useCallback } from "react";
import { DEFAULT_MAP_CENTER } from "@/lib/constants";

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  status: "idle" | "granted" | "denied" | "unavailable";
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    status: "idle",
    error: null,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        lat: DEFAULT_MAP_CENTER[0],
        lng: DEFAULT_MAP_CENTER[1],
        status: "unavailable",
        error: "Geolocalización no disponible en este navegador.",
      });
      return;
    }

    // Don't ask again if already granted
    if (state.status === "granted") return;

    setState((s) => ({ ...s, status: "idle" }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          status: "granted",
          error: null,
        });
      },
      (err) => {
        setState({
          lat: DEFAULT_MAP_CENTER[0],
          lng: DEFAULT_MAP_CENTER[1],
          status: "denied",
          error:
            err.code === err.PERMISSION_DENIED
              ? "Activa la ubicación para ver distancias."
              : "No se pudo obtener tu ubicación.",
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [state.status]);

  return { ...state, requestLocation };
}
