import { Routes, Route, Navigate } from "react-router-dom";
import useAdminStore from "./store/useAdminStore.js";
import Layout from "./components/layout/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import CategoriesPage from "./pages/CategoriesPage.jsx";
import CouponsPage from "./pages/CouponsPage.jsx";
import ReviewsPage from "./pages/ReviewsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import PromosPage from "./pages/PromosPage.jsx";
import ContactMessagesPage from "./pages/ContactMessagesPage.jsx";
import LibroReclamacionesPage from "./pages/LibroReclamacionesPage.jsx";
import NewsletterSubscribersPage from "./pages/NewsletterSubscribersPage.jsx";

function ProtectedRoute({ children }) {
  const token = useAdminStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="promos" element={<PromosPage />} />
        <Route path="contact-messages" element={<ContactMessagesPage />} />
        <Route path="libro-reclamaciones" element={<LibroReclamacionesPage />} />
        <Route path="newsletter-subscribers" element={<NewsletterSubscribersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}