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
  ChevronRight,
  MessageCircle,
  ClipboardList,
  Mail,
} from "lucide-react";
import useAdminStore from "../../store/useAdminStore.js";

const NAV_SECTIONS = [
  {
    label: "General",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { to: "/products", icon: Package, label: "Productos" },
      { to: "/categories", icon: Grid3x3, label: "Categorías" },
      { to: "/coupons", icon: Tag, label: "Cupones" },
      { to: "/promos", icon: Megaphone, label: "Promociones" },
    ],
  },
  {
    label: "Ventas",
    items: [
      { to: "/orders", icon: ShoppingBag, label: "Pedidos" },
      { to: "/users", icon: Users, label: "Usuarios" },
      { to: "/reviews", icon: Star, label: "Reseñas" },
    ],
  },
  {
    label: "Soporte",
    items: [
      { to: "/contact-messages", icon: MessageCircle, label: "Mensajes de contacto" },
      { to: "/libro-reclamaciones", icon: ClipboardList, label: "Libro de reclamaciones" },
      { to: "/newsletter-subscribers", icon: Mail, label: "Suscriptores newsletter" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/settings", icon: Settings, label: "Configuración" },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAdminStore();

  return (
    <aside className="w-[250px] flex flex-col flex-shrink-0" style={{ background: "#0f0f11" }}>

      {/* Logo */}
      <div className="px-14 py-5 flex items-center gap-2.5" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <h1 className="text-[20px] font-bold text-white tracking-tight">
          Mirage<span className="text-red-400">Mart</span>
        </h1>
        <span
          className="text-[10px] font-semibold tracking-widest"
          style={{
            color: "#6b7280",
            background: "rgba(255,255,255,0.06)",
            border: "0.5px solid rgba(255,255,255,0.08)",
            padding: "2px 7px",
            borderRadius: "99px",
            letterSpacing: "0.3px",
          }}
        >
          ADMIN
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 flex flex-col overflow-y-auto gap-0.5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p
              className="text-[12px] font-semibold uppercase px-2.5 pt-3 pb-1"
              style={{ color: "#4b5563", letterSpacing: "0.6px" }}
            >
              {section.label}
            </p>
            {section.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-[8px] rounded-xd text-[13px] font-medium transition-all duration-150 ${isActive
                    ? "text-white"
                    : "text-gray-300 hover:text-gray-200"
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: "#1e1e23" }
                    : { background: "transparent" }
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} className={isActive ? "text-white" : "text-gray-500"} />
                    <span className="flex-1">{label}</span>
                    {isActive && (
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ background: "#f87171" }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer - usuario */}
      <div className="p-2" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 group"
          style={{ background: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: "#7f1d1d", color: "#fca5a5" }}
          >
            {user?.nombre?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-gray-200 truncate leading-tight">
              {user?.nombre ?? "Administrador"}
            </p>
            <p className="text-[11px] truncate" style={{ color: "#4b5563" }}>
              {user?.email ?? ""}
            </p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "#6b7280" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e5e7eb")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}