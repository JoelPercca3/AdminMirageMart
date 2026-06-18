import { useLocation } from "react-router-dom";
import { Bell, ExternalLink } from "lucide-react";
import useAdminStore from "../../store/useAdminStore.js";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/products": "Productos",
  "/orders": "Pedidos",
  "/users": "Usuarios",
  "/categories": "Categorías",
  "/coupons": "Cupones",
  "/reviews": "Reseñas",
  "/settings": "Configuración",
};

export default function Header() {
  const { pathname } = useLocation();
  const { user } = useAdminStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <h2 className="text-lg font-bold text-gray-800">
        {PAGE_TITLES[pathname] || "Admin"}
      </h2>

      <div className="flex items-center gap-3">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          <ExternalLink size={15} />
          Ver tienda
        </a>

        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
          <Bell size={18} className="text-gray-500" />
        </button>

        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {user?.nombre?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
