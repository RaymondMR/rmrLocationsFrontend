import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import App from "./App.tsx";
import { useAuthStore } from "@/stores/auth-store";
import "./index.css";

// Resuelve el estado de autenticación inicial antes de que React monte.
//
// El store nace en status "loading" y LoginPage/RegisterPage muestran un esqueleto
// mientras siga así. Sin esta llamada nadie lo saca de ese estado y los formularios
// de acceso y registro no se pintan nunca.
//
// Va aquí, en el ámbito del módulo, y no en un useEffect: se ejecuta una sola vez,
// sin duplicarse por el doble montaje de StrictMode en desarrollo.
// No se espera el resultado a propósito — la app renderiza de inmediato y se
// actualiza sola cuando el store cambia de estado.
void useAuthStore.getState().bootstrap();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 120_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          duration={4000}
          toastOptions={{
            style: {
              background: "var(--surface)",
              color: "var(--ink)",
              border: "1px solid var(--border)",
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
