import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Eye, Truck, Copy, X } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";

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
  reembolso_parcial: "amber",
};

const STATUS_OPTIONS = [
  "pendiente",
  "pagado",
  "preparando",
  "enviado",
  "entregado",
  "cancelado",
  "reembolsado",
  "reembolso_parcial",
];

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);
  const [viewOrder, setViewOrder] = useState(null);
  const [trackModal, setTrackModal] = useState(null);
  const [refundModal, setRefundModal] = useState(null);
  const queryClient = useQueryClient();

  const refundMutation = useMutation({
    mutationFn: ({ charge_id, order_id, amount, reason }) =>
      adminAPI.refundOrder(charge_id, order_id, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order"] });
      setRefundModal(null);
      toast.success("Reembolso procesado exitosamente");
    },
    onError: (err) => toast.error(err.message || "Error al procesar el reembolso"),
  });

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
    mutationFn: ({ id, tracking_number, courier, clave_recojo }) =>
      adminAPI.updateTracking(id, tracking_number, courier, clave_recojo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setTrackModal(null);
      toast.success("Tracking actualizado");
    },
    onError: (err) =>
      toast.error(err.message || "Error al actualizar tracking"),
  });

  const copiarDatosEnvio = () => {
    if (!orderDetail) return;

    const texto = `PEDIDO: ${orderDetail.codigo_orden}
DESTINATARIO: ${orderDetail.nombre_destinatario}
DOCUMENTO: ${orderDetail.cliente_tipo_documento || "-"} ${orderDetail.cliente_numero_documento || "-"}
TELÉFONO: ${orderDetail.telefono_contacto || orderDetail.cliente_telefono || "-"}
DIRECCIÓN: ${orderDetail.calle}
REFERENCIA: ${orderDetail.referencia || "-"}
DISTRITO: ${orderDetail.distrito}
PROVINCIA: ${orderDetail.provincia}
DEPARTAMENTO: ${orderDetail.departamento}
COD. POSTAL: ${orderDetail.codigo_postal || "-"}
PRODUCTOS: ${orderDetail.items?.map((i) => `${i.nombre_producto} x${i.cantidad}`).join(", ")}
TOTAL: ${formatPrice(orderDetail.total)}${orderDetail.tracking_number
        ? `
COURIER: ${orderDetail.courier || "-"}
GUÍA: ${orderDetail.tracking_number}${orderDetail.clave_recojo ? `
CLAVE DE RECOJO: ${orderDetail.clave_recojo}` : ""}`
        : ""
      }`;

    navigator.clipboard.writeText(texto);
    toast.success("Datos de envío copiados");
  };

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
        title={`Detalle del Pedido #${orderDetail?.codigo_orden || ""}`}
        size="lg"
      >
        {orderDetail ? (
          <div className="flex flex-col gap-6">
            {/* Botón copiar datos - cabecera */}
            <div className="flex justify-end border-b border-gray-100 pb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={copiarDatosEnvio}
                className="cursor-pointer flex items-center gap-1.5 text-blue-600 hover:text-blue-700"
              >
                <Copy size={14} />
                Copiar datos de envío
              </Button>
            </div>

            {/* Grid de información */}
            <div className="grid grid-cols-2 gap-6">
              {/* Columna izquierda - Cliente y Dirección */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Información del Cliente
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="font-semibold text-gray-800">
                      {orderDetail.cliente_nombre}
                    </p>
                    <p className="text-sm text-gray-600">
                      {orderDetail.cliente_email}
                    </p>
                    {orderDetail.cliente_telefono && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span>📱</span> {orderDetail.cliente_telefono}
                      </p>
                    )}
                    {orderDetail.cliente_numero_documento && (
                      <p className="text-sm text-gray-600">
                        {orderDetail.cliente_tipo_documento}: {orderDetail.cliente_numero_documento}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Dirección de Envío
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="font-semibold text-gray-800">
                      {orderDetail.nombre_destinatario}
                    </p>
                    <p className="text-sm text-gray-600">
                      {orderDetail.calle}
                    </p>
                    {orderDetail.referencia && (
                      <p className="text-sm text-gray-500 italic">
                        Ref: {orderDetail.referencia}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      {orderDetail.distrito}, {orderDetail.provincia}
                    </p>
                    <p className="text-sm text-gray-600">
                      {orderDetail.departamento}
                    </p>
                    {orderDetail.codigo_postal && (
                      <p className="text-sm text-gray-600">
                        CP: {orderDetail.codigo_postal}
                      </p>
                    )}
                    {orderDetail.telefono_contacto && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span>📞</span> {orderDetail.telefono_contacto}
                      </p>
                    )}
                  </div>
                </div>

                {/* Info de envío/tracking, solo aparece si ya se despachó */}
                {orderDetail.tracking_number && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Información de Envío
                    </h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Courier</p>
                          <p className="font-semibold text-gray-800">
                            {orderDetail.courier || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Código de seguimiento</p>
                          <p className="font-mono font-semibold text-gray-800">
                            {orderDetail.tracking_number}
                          </p>
                        </div>
                        {orderDetail.clave_recojo && (
                          <div className="col-span-2">
                            <p className="text-gray-500 text-xs">Clave de recojo</p>
                            <p className="font-mono font-bold text-green-700 text-base">
                              {orderDetail.clave_recojo}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Columna derecha - Productos y total */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Productos
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                    {orderDetail.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-start text-sm border-b border-gray-200 pb-2 last:border-0"
                      >
                        <div className="flex-1 pr-4">
                          <p className="font-medium text-gray-800">
                            {item.nombre_producto}
                          </p>
                          <p className="text-xs text-gray-500">
                            Cantidad: {item.cantidad}
                          </p>
                        </div>
                        <span className="font-bold text-red-500 whitespace-nowrap">
                          {formatPrice(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">Total del Pedido</span>
                    <span className="text-xl font-bold text-red-500">
                      {formatPrice(orderDetail.total)}
                    </span>
                  </div>
                </div>

                {/* Estado actual */}
                <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                  <span className="text-sm font-medium text-gray-700">Estado actual:</span>
                  <Badge variant={STATUS_BADGE[orderDetail.estado]}>
                    {orderDetail.estado}
                  </Badge>
                </div>

                {/* ✅ NUEVO: Resumen de reembolso + historial */}
                {orderDetail.refunds?.length > 0 && (
                  <div className="space-y-3">
                    {/* Resumen */}
                    <div className={`rounded-lg p-4 flex items-center justify-between border ${orderDetail.estado === "reembolsado"
                      ? "bg-red-50 border-red-200"
                      : "bg-amber-50 border-amber-200"
                      }`}>
                      <span className={`text-sm font-semibold ${orderDetail.estado === "reembolsado" ? "text-red-700" : "text-amber-700"
                        }`}>
                        {orderDetail.estado === "reembolsado" ? "Reembolso Total" : "Reembolso Parcial"}
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        S/ {Number(orderDetail.payment?.monto_reembolsado || 0).toFixed(2)} de S/ {Number(orderDetail.total).toFixed(2)}
                      </span>
                    </div>

                    {/* Historial detallado */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Historial de Reembolsos ({orderDetail.refunds.length})
                      </h4>
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {orderDetail.refunds.map((r, idx) => {
                          let motivo = r.reason;
                          try {
                            const raw = typeof r.respuesta_pasarela === "string"
                              ? JSON.parse(r.respuesta_pasarela)
                              : r.respuesta_pasarela;
                            motivo = raw?.reason || r.reason;
                          } catch {
                            // motivo ya tiene el fallback de r.reason
                          }

                          return (
                            <div
                              key={r.id}
                              className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm space-y-1"
                            >
                              <div className="flex justify-between">
                                <span className="font-semibold text-gray-700">
                                  Movimiento #{idx + 1}
                                </span>
                                <span className="font-bold text-gray-800">
                                  S/ {Number(r.monto).toFixed(2)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600">
                                Motivo: {motivo}
                              </div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span className="font-mono truncate max-w-[140px]">{r.refund_id}</span>
                                <span>{r.fecha_reembolso || "—"}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Aviso de reembolso pendiente */}
                {orderDetail.necesita_reembolso && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700 font-medium">
                    ⚠️ Este pedido fue cancelado pero tiene un pago pendiente de reembolso.
                  </div>
                )}

                {(["pagado", "preparando", "enviado", "entregado", "reembolso_parcial"].includes(orderDetail.estado) ||
                  orderDetail.necesita_reembolso) &&

                  orderDetail.payment?.referencia_externa && (

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-red-500 text-red-500 hover:bg-red-50"
                      onClick={() => setRefundModal(orderDetail)}
                    >
                      {orderDetail.estado === "reembolso_parcial"
                        ? "Reembolsar saldo restante"
                        : "Reembolsar pedido"}
                    </Button>
                  )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}
      </Modal>

      {/* Modal tracking */}
      <TrackingModal
        orderId={trackModal}
        isOpen={!!trackModal}
        onClose={() => setTrackModal(null)}
        onSubmit={(data) =>
          trackingMutation.mutate({ id: trackModal, ...data })
        }
        loading={trackingMutation.isPending}
      />

      {/* Modal de reembolso */}
      <RefundModal
        order={refundModal}
        isOpen={!!refundModal}
        onClose={() => setRefundModal(null)}
        onSubmit={({ amount, reason }) => {
          refundMutation.mutate({
            charge_id: refundModal.payment.referencia_externa,
            order_id: refundModal.id,
            amount,
            reason,
          });
        }}
        loading={refundMutation.isPending}
      />
    </div>
  );
}

function RefundModal({ order, isOpen, onClose, onSubmit, loading }) {
  const [usePartial, setUsePartial] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const saldoDisponible = Number(order?.total || 0) - Number(order?.payment?.monto_reembolsado || 0);

  const handleClose = () => {
    reset();
    setUsePartial(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Reembolsar pedido #${order?.codigo_orden || ""}`}
      size="sm"
    >
      <form
        onSubmit={handleSubmit((data) => {
          onSubmit({
            amount: usePartial ? Number(data.amount) : undefined,
            reason: data.reason,
          });
        })}
        className="flex flex-col gap-4"
      >
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">
            {order?.payment?.monto_reembolsado > 0 ? "Saldo disponible para reembolsar" : "Total del pedido"}
          </p>
          <p className="text-xl font-bold text-gray-800">
            {formatPrice(saldoDisponible)}
          </p>
          {order?.payment?.monto_reembolsado > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Ya se reembolsó S/ {Number(order?.payment?.monto_reembolsado).toFixed(2)} de S/ {Number(order?.total).toFixed(2)}
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={usePartial}
            onChange={(e) => setUsePartial(e.target.checked)}
            className="w-4 h-4 text-red-500 rounded"
          />
          <span className="text-sm text-gray-700">
            Reembolso parcial (monto específico)
          </span>
        </label>

        {usePartial && (
          <Input
            label="Monto a reembolsar (S/)"
            type="number"
            step="0.01"
            max={saldoDisponible}
            placeholder={`Máximo: ${saldoDisponible.toFixed(2)}`}
            error={errors.amount?.message}
            {...register("amount", {
              required: usePartial ? "Ingresa un monto" : false,
              max: {
                value: saldoDisponible,
                message: `No puede superar el saldo disponible (S/ ${saldoDisponible.toFixed(2)})`,
              },
              min: { value: 0.01, message: "Monto inválido" },
            })}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo
          </label>
          <select
            {...register("reason")}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          >
            <option value="solicitud_comprador">Solicitud del comprador</option>
            <option value="duplicado">Cargo duplicado</option>
            <option value="fraudulento">Cargo fraudulento</option>
            <option value="otro">Otro motivo</option>
          </select>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">
            Esta acción es irreversible y notificará el reembolso a través de la pasarela de pago.
            {!usePartial && " Se reembolsará el monto total del pedido."}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="danger" loading={loading}>
            Confirmar reembolso
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function TrackingModal({ isOpen, onClose, onSubmit, loading }) {
  const { register, handleSubmit, reset } = useForm();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar guía de envío"
      size="sm"
    >
      <form
        onSubmit={handleSubmit((data) => {
          onSubmit(data);
          reset();
        })}
        className="flex flex-col gap-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Courier
          </label>
          <select
            {...register("courier", { required: true })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          >
            <option value="Shalom">Shalom</option>
            <option value="Olva Courier">Olva Courier</option>
            <option value="Cruz del Sur Cargo">Cruz del Sur Cargo</option>
            <option value="Marvisur">Marvisur</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <Input
          label="Código de seguimiento"
          placeholder="Ej: 86163033-WKN9"
          {...register("tracking_number", { required: true })}
        />

        <Input
          label="Clave de recojo (opcional — solo si es recojo en agencia)"
          placeholder="Ej: 1001"
          {...register("clave_recojo")}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Guardar y enviar
          </Button>
        </div>
      </form>
    </Modal>
  );
}