import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Eye, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form"; // ← agrega esta línea

import { adminAPI } from "../api/admin.api.js";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Modal from "../components/ui/Modal.jsx";
import Input from "../components/ui/Input.jsx";
import { formatPrice } from "../utils/formatPrice.js";
import { formatDateShort } from "../utils/formatDate.js";

const STATUS_BADGE = {
  pendiente: "yellow",
  pagado: "blue",
  preparando: "purple",
  enviado: "blue",
  entregado: "green",
  cancelado: "red",
  reembolsado: "gray",
};

const STATUS_OPTIONS = [
  "pendiente",
  "pagado",
  "preparando",
  "enviado",
  "entregado",
  "cancelado",
  "reembolsado",
];

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);
  const [viewOrder, setViewOrder] = useState(null);
  const [trackModal, setTrackModal] = useState(null);
  const queryClient = useQueryClient();

  const { data: result, isLoading } = useQuery({
    queryKey: ["admin-orders", page, search, estado],
    queryFn: () => adminAPI.getOrders({ page, limit: 15, search, estado }),
    select: (res) => res,
  });

  const orders = result?.data || [];
  const meta = result?.meta || {};

  const { data: orderDetail } = useQuery({
    queryKey: ["admin-order", viewOrder],
    queryFn: () => adminAPI.getOrder(viewOrder),
    select: (res) => res.data,
    enabled: !!viewOrder,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, estado, comentario }) =>
      adminAPI.updateStatus(id, estado, comentario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order"] });
      toast.success("Estado actualizado");
    },
    onError: (err) => toast.error(err.message || "Error al actualizar"),
  });

  const trackingMutation = useMutation({
    mutationFn: ({ id, tracking }) => adminAPI.updateTracking(id, tracking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setTrackModal(null);
      toast.success("Tracking actualizado");
    },
    onError: (err) =>
      toast.error(err.message || "Error al actualizar tracking"),
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Pedidos</h1>
          <p className="text-sm text-gray-500">
            {meta.total || 0} pedidos en total
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar por código o email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400"
          />
        </div>
        <select
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <Spinner />
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            No se encontraron pedidos
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Código
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Total
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Estado
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Cambiar estado
                  </th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-gray-800">
                      #{order.codigo_orden}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">
                        {order.cliente}
                      </p>
                      <p className="text-xs text-gray-400">{order.email}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {formatDateShort(order.created_at)}
                    </td>
                    <td className="py-3 px-4 font-bold text-red-500">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={STATUS_BADGE[order.estado]}>
                        {order.estado}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={order.estado}
                        onChange={(e) =>
                          statusMutation.mutate({
                            id: order.id,
                            estado: e.target.value,
                            comentario: `Estado cambiado a ${e.target.value} por admin`,
                          })
                        }
                        className="text-xs px-2 py-1 border border-gray-200 rounded-lg outline-none focus:border-red-400"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewOrder(order.id)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg transition"
                          title="Ver detalle"
                        >
                          <Eye size={15} className="text-blue-500" />
                        </button>
                        <button
                          onClick={() => setTrackModal(order.id)}
                          className="p-1.5 hover:bg-green-50 rounded-lg transition"
                          title="Agregar tracking"
                        >
                          <Truck size={15} className="text-green-500" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {meta.totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Página {meta.page} de {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal detalle de orden */}
      <Modal
        isOpen={!!viewOrder}
        onClose={() => setViewOrder(null)}
        title={`Pedido #${orderDetail?.codigo_orden || ""}`}
        size="lg"
      >
        {orderDetail ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Cliente</p>
                <p className="font-semibold">{orderDetail.cliente_nombre}</p>
                <p className="text-gray-400">{orderDetail.cliente_email}</p>
              </div>
              <div>
                <p className="text-gray-500">Dirección</p>
                <p className="font-semibold">
                  {orderDetail.nombre_destinatario}
                </p>
                <p className="text-gray-400">
                  {orderDetail.calle}, {orderDetail.ciudad}
                </p>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="font-semibold text-gray-800 mb-3">Productos</p>
              {orderDetail.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm py-2 border-b border-gray-50"
                >
                  <span>
                    {item.nombre_producto} x{item.cantidad}
                  </span>
                  <span className="font-bold">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-base pt-2">
              <span>Total</span>
              <span className="text-red-500">
                {formatPrice(orderDetail.total)}
              </span>
            </div>
          </div>
        ) : (
          <Spinner />
        )}
      </Modal>

      {/* Modal tracking */}
      <TrackingModal
        orderId={trackModal}
        isOpen={!!trackModal}
        onClose={() => setTrackModal(null)}
        onSubmit={(tracking) =>
          trackingMutation.mutate({ id: trackModal, tracking })
        }
        loading={trackingMutation.isPending}
      />
    </div>
  );
}

function TrackingModal({ isOpen, onClose, onSubmit, loading }) {
  const { register, handleSubmit, reset } = useForm();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar número de tracking"
      size="sm"
    >
      <form
        onSubmit={handleSubmit((data) => {
          onSubmit(data.tracking);
          reset();
        })}
        className="flex flex-col gap-4"
      >
        <Input
          label="Número de tracking"
          placeholder="Ej: PE123456789"
          {...register("tracking", { required: true })}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
