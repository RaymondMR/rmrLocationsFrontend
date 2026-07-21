import type { ProblemDetails } from "@/types/models";

/** Mapea errores de API a mensajes de usuario amigables */
export function getApiErrorMessage(
  error: unknown,
  context?: string
): string {
  if (error && typeof error === "object" && "response" in error) {
    const resp = (error as { response?: { status?: number; data?: ProblemDetails & { errors?: Record<string, string[]> } } }).response;
    const status = resp?.status;
    const data = resp?.data;

    switch (status) {
      case 400:
        if (data?.detail) return data.detail;
        if (data?.title) return data.title;
        return "Datos inválidos. Revisa los campos e intenta de nuevo.";
      case 401:
        return context === "session"
          ? "Tu sesión expiró. Inicia sesión de nuevo."
          : "Credenciales inválidas.";
      case 403:
        return "No tienes permisos para esta acción.";
      case 404:
        return context === "write"
          ? "El registro no existe o fue modificado por alguien más. Recarga e intenta de nuevo."
          : `No encontramos ${context || "este recurso"}.`;
      case 409:
        return data?.detail || "Conflicto: el recurso ya existe o tiene dependencias.";
      case 500:
        return "Algo salió mal en el servidor. Intenta de nuevo en unos momentos.";
      default:
        if (status && status >= 500) {
          return "Error del servidor. Intenta más tarde.";
        }
        return "Algo salió mal. Revisa tu conexión e intenta de nuevo.";
    }
  }

  if (error instanceof Error && error.message === "Network Error") {
    return "No hay conexión con el servidor. Revisa tu red e intenta de nuevo.";
  }

  return "Error inesperado. Intenta de nuevo.";
}
