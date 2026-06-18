import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Star,
  Settings,
  Grid3x3,
  LogOut,
  Megaphone,
} from "lucide-react";
import useAdminStore from "../../store/useAdminStore.js";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/products", icon: Package, label: "Productos" },
  { to: "/orders", icon: ShoppingBag, label: "Pedidos" },
  { to: "/users", icon: Users, label: "Usuarios" },
  { to: "/categories", icon: Grid3x3, label: "Categorías" },
  { to: "/coupons", icon: Tag, label: "Cupones" },
  { to: "/reviews", icon: Star, label: "Reseñas" },
  { to: "/promos", icon: Megaphone, label: "Promociones" }, // ← NUEVO
  { to: "/settings", icon: Settings, label: "Configuración" },
];

export default function Sidebar() {
  const { user, logout } = useAdminStore();

  return (
    <aside className="w-64 bg-gray-900 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-extrabold text-white">
          Mirage<span className="text-red-400">Mart</span>
          <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
            Admin
          </span>
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${isActive
                ? "bg-red-500 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.nombre?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.nombre}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}