import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { refreshAccessToken } from "@/lib/refresh-token";
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

  useEffect(() => {
    // Bootstrap session: try to refresh token on mount
    const rt = localStorage.getItem("rmr.refreshToken");
    const uid = localStorage.getItem("rmr.userId");
    if (rt && uid) {
      refreshAccessToken().finally(() => {
        const store = useAuthStore.getState();
        if (store.status === "loading") {
          store.logout();
        }
      });
    }
  }, []);

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
