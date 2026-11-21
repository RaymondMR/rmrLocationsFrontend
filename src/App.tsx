import { Routes, Route } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import AppShell from "@/components/layout/AppShell";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Pages (lazy loaded in production, eager for now)
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import LocationsPage from "@/pages/LocationsPage";
import LocationDetailPage from "@/pages/LocationDetailPage";
import LocationNewPage from "@/pages/LocationNewPage";
import LocationEditPage from "@/pages/LocationEditPage";
import CategoriesPage from "@/pages/CategoriesPage";
import CategoryDetailPage from "@/pages/CategoryDetailPage";
import CategoryNewPage from "@/pages/CategoryNewPage";
import CategoryEditPage from "@/pages/CategoryEditPage";
import TagsPage from "@/pages/TagsPage";
import TagDetailPage from "@/pages/TagDetailPage";
import CollectionsPage from "@/pages/CollectionsPage";
import CollectionDetailPage from "@/pages/CollectionDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ContactPage from "@/pages/ContactPage";

export default function App() {
  const status = useAuthStore((s) => s.status);

  // El refresh silencioso al arrancar lo hace una sola vez `bootstrap()` desde
  // main.tsx (ámbito de módulo). NO replicarlo aquí con un useEffect: si dos
  // triggers llaman a /api/auth/refresh-token a la vez, la rotación de tokens
  // del backend invalida el perdedor (401 "Invalid refresh token") y dispara
  // logout(), cerrando la sesión en cada recarga / URL directa.

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="locations/:id" element={<LocationDetailPage />} />
        <Route
          path="locations/new"
          element={
            <ProtectedRoute>
              <LocationNewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="locations/:id/edit"
          element={
            <ProtectedRoute>
              <LocationEditPage />
            </ProtectedRoute>
          }
        />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="categories/:id" element={<CategoryDetailPage />} />
        <Route
          path="categories/new"
          element={
            <ProtectedRoute role="Admin">
              <CategoryNewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="categories/:id/edit"
          element={
            <ProtectedRoute role="Admin">
              <CategoryEditPage />
            </ProtectedRoute>
          }
        />
        <Route path="tags" element={<TagsPage />} />
        <Route path="tags/:id" element={<TagDetailPage />} />
        <Route
          path="collections"
          element={
            <ProtectedRoute>
              <CollectionsPage />
            </ProtectedRoute>
          }
        />
        <Route path="collections/:id" element={<CollectionDetailPage />} />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute role="Admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
