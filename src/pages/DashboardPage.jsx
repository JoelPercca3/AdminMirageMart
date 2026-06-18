import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { adminAPI } from "../api/admin.api.js";
import Spinner from "../components/ui/Spinner.jsx";
import { formatPrice } from "../utils/formatPrice.js";
import { formatDateShort } from "../utils/formatDate.js";

// ── Tarjeta de métrica ────────────────────────────────────
function MetricCard({ title, value, icon: Icon, color, subtitle }) {
  const colors = {
    red: "bg-red-50 text-red-500",
    blue: "bg-blue-50 text-blue-500",
    green: "bg-green-50 text-green-500",
    purple: "bg-purple-50 text-purple-500",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-extrabold text-gray-800">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: adminAPI.dashboard,
    select: (res) => res.data,
  });

  const { data: salesData } = useQuery({
    queryKey: ["sales-stats"],
    queryFn: adminAPI.salesStats,
    select: (res) =>
      res.data?.map((d) => ({
        fecha: formatDateShort(d.fecha),
        pedidos: d.total_pedidos,
        ingresos: Number(d.ingresos || 0),
      })) || [],
  });

  const { data: topProducts } = useQuery({
    queryKey: ["product-stats"],
    queryFn: adminAPI.productStats,
    select: (res) => res.data?.slice(0, 5) || [],
  });

  const { data: revenueData } = useQuery({
    queryKey: ["revenue-stats"],
    queryFn: adminAPI.revenueStats,
    select: (res) =>
      res.data
        ?.map((d) => ({
          mes: `${d.mes}/${d.año}`,
          ingresos: Number(d.ingresos || 0),
          pedidos: d.pedidos,
        }))
        .reverse() || [],
  });

  if (isLoading) return <Spinner size="lg" />;

  return (
    <div className="flex flex-col gap-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Clientes totales"
          value={stats?.total_clientes || 0}
          icon={Users}
          color="blue"
          subtitle="Usuarios registrados"
        />
        <MetricCard
          title="Productos activos"
          value={stats?.total_productos || 0}
          icon={Package}
          color="purple"
          subtitle="En catálogo"
        />
        <MetricCard
          title="Pedidos hoy"
          value={stats?.pedidos_hoy || 0}
          icon={ShoppingBag}
          color="red"
          subtitle="Nuevos pedidos"
        />
        <MetricCard
          title="Ingresos del mes"
          value={formatPrice(stats?.ingresos_mes || 0)}
          icon={TrendingUp}
          color="green"
          subtitle="Pedidos pagados"
        />
      </div>

      {/* Alertas */}
      {(stats?.pedidos_pendientes > 0 || stats?.reviews_pendientes > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats?.pedidos_pendientes > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <p className="text-sm font-medium text-yellow-800">
                  {stats.pedidos_pendientes} pedido(s) pendientes de atención
                </p>
              </div>
              <a
                href="/orders"
                className="text-xs text-yellow-600 font-semibold hover:underline"
              >
                Ver →
              </a>
            </div>
          )}
          {stats?.reviews_pendientes > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <p className="text-sm font-medium text-blue-800">
                  {stats.reviews_pendientes} reseña(s) pendientes de aprobación
                </p>
              </div>
              <a
                href="/reviews"
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Ver →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas últimos 30 días */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">
            Ventas últimos 30 días
          </h3>
          {salesData?.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No hay datos de ventas aún
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [
                    name === "ingresos" ? formatPrice(value) : value,
                    name === "ingresos" ? "Ingresos" : "Pedidos",
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: "#EF4444", r: 3 }}
                  name="ingresos"
                />
                <Line
                  type="monotone"
                  dataKey="pedidos"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={{ fill: "#6366F1", r: 3 }}
                  name="pedidos"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ingresos por mes */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Ingresos por mes</h3>
          {revenueData?.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No hay datos de ingresos aún
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatPrice(value)} />
                <Bar
                  dataKey="ingresos"
                  fill="#EF4444"
                  radius={[6, 6, 0, 0]}
                  name="Ingresos"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top productos */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4">
          🔥 Productos más vendidos
        </h3>
        {topProducts?.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            No hay ventas registradas aún
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    #
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Producto
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Ventas
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Stock
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Rating
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Precio
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProducts?.map((p, i) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4 text-gray-400 font-medium">
                      {i + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {p.nombre}
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <ArrowUp size={12} /> {p.ventas_count}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-medium ${p.stock_total < 10 ? "text-red-500" : "text-gray-700"}`}
                      >
                        {p.stock_total}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-yellow-500 font-medium">
                      ⭐ {Number(p.rating_promedio || 0).toFixed(1)}
                    </td>
                    <td className="py-3 px-4 font-bold text-red-500">
                      {formatPrice(p.precio)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
