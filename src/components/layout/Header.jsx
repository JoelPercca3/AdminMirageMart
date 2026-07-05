import { useLocation } from "react-router-dom";
import { Bell, ExternalLink, ChevronRight, Home } from "lucide-react";
import useAdminStore from "../../store/useAdminStore.js";

const PAGE_META = {
  "/dashboard": { title: "Dashboard", section: null },
  "/products": { title: "Productos", section: "Catálogo" },
  "/orders": { title: "Pedidos", section: "Ventas" },
  "/users": { title: "Usuarios", section: "Ventas" },
  "/categories": { title: "Categorías", section: "Catálogo" },
  "/coupons": { title: "Cupones", section: "Catálogo" },
  "/reviews": { title: "Reseñas", section: "Ventas" },
  "/promos": { title: "Promociones", section: "Catálogo" },
  "/settings": { title: "Configuración", section: "Sistema" },
};

export default function Header() {
  const { pathname } = useLocation();
  const { user } = useAdminStore();

  const meta = PAGE_META[pathname] ?? { title: "Admin", section: null };

  return (
    <header
      className="bg-white flex items-center justify-between px-6 flex-shrink-0"
      style={{
        height: "52px",
        borderBottom: "0.5px solid #e5e7eb",
      }}
    >
      {/* Breadcrumb + título */}
      <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#9ca3af" }}>
        <Home size={13} />
        {meta.section && (
          <>
            <ChevronRight size={11} />
            <span>{meta.section}</span>
          </>
        )}
        <ChevronRight size={11} />
        <span className="text-[14px] font-semibold" style={{ color: "#111827" }}>
          {meta.title}
        </span>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">

        {/* Ver tienda */}
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg transition-colors duration-150"
          style={{
            color: "#6b7280",
            border: "0.5px solid #e5e7eb",
            background: "#fff",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f9fafb";
            e.currentTarget.style.color = "#374151";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.color = "#6b7280";
          }}
        >
          <ExternalLink size={13} />
          Ver tienda
        </a>

        {/* Notificaciones */}
        <button
          className="flex items-center justify-center rounded-lg transition-colors duration-150"
          style={{
            width: "32px",
            height: "32px",
            border: "0.5px solid #e5e7eb",
            background: "#fff",
            color: "#6b7280",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f9fafb";
            e.currentTarget.style.color = "#374151";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.color = "#6b7280";
          }}
        >
          <Bell size={15} />
        </button>

        {/* Avatar */}
        <div
          className="flex items-center justify-center text-[12px] font-bold rounded-lg flex-shrink-0"
          style={{
            width: "32px",
            height: "32px",
            background: "#7f1d1d",
            color: "#fca5a5",
          }}
        >
          {user?.nombre?.[0]?.toUpperCase() ?? "A"}
        </div>
      </div>
    </header>
  );
}