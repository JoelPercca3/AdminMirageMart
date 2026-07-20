
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Image as ImageIcon } from "lucide-react";
import { adminAPI } from "../api/admin.api.js";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Modal from "../components/ui/Modal.jsx";
import { formatPrice } from "../utils/formatPrice.js";
import { formatDateShort } from "../utils/formatDate.js";

const STATUS_BADGE = {
    pendiente: "yellow",
    aprobado: "blue",
    recibido: "purple",
    reembolsado: "green",
    rechazado: "red",
};

const MOTIVO_LABELS = {
    producto_defectuoso: "Producto defectuoso",
    talla_incorrecta: "Talla incorrecta",
    producto_equivocado: "Producto equivocado",
    no_es_lo_que_esperaba: "No es lo que esperaba",
    otro: "Otro motivo",
};

const STATUS_OPTIONS = ["pendiente", "aprobado", "recibido", "reembolsado", "rechazado"];

export default function ReturnRequestsPage() {
    const [estado, setEstado] = useState("pendiente");
    const [photosModal, setPhotosModal] = useState(null);
    const [approveModal, setApproveModal] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [instrucciones, setInstrucciones] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const queryClient = useQueryClient();

    const { data: result, isLoading } = useQuery({
        queryKey: ["return-requests", estado],
        queryFn: () => adminAPI.getReturnRequests({ estado, limit: 20 }),
        select: (res) => res,
    });

    const requests = result?.data || [];

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["return-requests"] });

    const approveMutation = useMutation({
        mutationFn: ({ id, instrucciones_admin }) =>
            adminAPI.approveReturnRequest(id, instrucciones_admin),
        onSuccess: () => {
            invalidate();
            setApproveModal(null);
            setInstrucciones("");
            toast.success("Solicitud aprobada");
        },
        onError: (err) => toast.error(err.message || "Error al aprobar"),
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, respuesta_admin }) => adminAPI.rejectReturnRequest(id, respuesta_admin),
        onSuccess: () => {
            invalidate();
            setRejectModal(null);
            setRejectReason("");
            toast.success("Solicitud rechazada");
        },
        onError: (err) => toast.error(err.message || "Error al rechazar"),
    });

    const receivedMutation = useMutation({
        mutationFn: (id) => adminAPI.markReturnReceived(id),
        onSuccess: () => {
            invalidate();
            toast.success("Producto marcado como recibido");
        },
        onError: (err) => toast.error(err.message || "Error al actualizar"),
    });

    const refundMutation = useMutation({
        mutationFn: (id) => adminAPI.confirmReturnRefund(id),
        onSuccess: () => {
            invalidate();
            toast.success("Reembolso procesado exitosamente");
        },
        onError: (err) => toast.error(err.message || "Error al procesar el reembolso"),
    });

    const parseFotos = (fotos) => {
        try {
            return typeof fotos === "string" ? JSON.parse(fotos) : fotos || [];
        } catch {
            return [];
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-xl font-bold text-gray-800">Solicitudes de devolución</h1>
                <p className="text-sm text-gray-500">{requests.length} solicitudes</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3">
                <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
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

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <Spinner />
                ) : requests.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">No hay solicitudes</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Pedido</th>
                                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Producto</th>
                                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Cliente</th>
                                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Motivo</th>
                                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Monto</th>
                                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Evidencia</th>
                                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Estado</th>
                                    <th className="text-right py-3 px-4 text-gray-500 font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((r) => {
                                    const fotos = parseFotos(r.fotos);
                                    return (
                                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="py-3 px-4 font-mono font-medium">#{r.codigo_orden}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    {r.imagen_url && (
                                                        <img
                                                            src={r.imagen_url}
                                                            alt=""
                                                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                                        />
                                                    )}
                                                    <p className="text-xs text-gray-700 max-w-[160px] truncate">
                                                        {r.nombre_producto}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="font-medium text-gray-800">{r.cliente}</p>
                                                <p className="text-xs text-gray-400">{r.email}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p>{MOTIVO_LABELS[r.motivo] || r.motivo}</p>
                                                {r.comentario && (
                                                    <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">
                                                        {r.comentario}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 font-bold text-red-500">
                                                {formatPrice(r.monto_reembolso)}
                                                <p className="text-xs text-gray-400 font-normal">x{r.cantidad}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                {fotos.length > 0 ? (
                                                    <button
                                                        onClick={() => setPhotosModal(fotos)}
                                                        className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                                                    >
                                                        <ImageIcon size={13} /> {fotos.length} foto(s)
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={STATUS_BADGE[r.estado]}>{r.estado}</Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2">
                                                    {r.estado === "pendiente" && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-green-500 text-green-600 hover:bg-green-50"
                                                                onClick={() => setApproveModal(r)}
                                                            >
                                                                Aprobar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-500 text-red-500 hover:bg-red-50"
                                                                onClick={() => setRejectModal(r)}
                                                            >
                                                                Rechazar
                                                            </Button>
                                                        </>
                                                    )}
                                                    {r.estado === "aprobado" && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-purple-500 text-purple-600 hover:bg-purple-50"
                                                                loading={receivedMutation.isPending}
                                                                onClick={() => receivedMutation.mutate(r.id)}
                                                            >
                                                                Marcar recibido
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-500 text-red-500 hover:bg-red-50"
                                                                onClick={() => setRejectModal(r)}
                                                            >
                                                                Rechazar
                                                            </Button>
                                                        </>
                                                    )}
                                                    {r.estado === "recibido" && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-green-500 text-green-600 hover:bg-green-50"
                                                                loading={refundMutation.isPending}
                                                                onClick={() => refundMutation.mutate(r.id)}
                                                            >
                                                                Confirmar y reembolsar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-500 text-red-500 hover:bg-red-50"
                                                                onClick={() => setRejectModal(r)}
                                                            >
                                                                Rechazar
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal: ver fotos de evidencia */}
            <Modal
                isOpen={!!photosModal}
                onClose={() => setPhotosModal(null)}
                title="Fotos de evidencia"
                size="md"
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photosModal?.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                            <img
                                src={url}
                                alt={`Evidencia ${i + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-100 hover:opacity-80 transition"
                            />
                        </a>
                    ))}
                </div>
            </Modal>

            {/* Modal: aprobar con instrucciones */}
            <Modal
                isOpen={!!approveModal}
                onClose={() => setApproveModal(null)}
                title={`Aprobar devolución — #${approveModal?.codigo_orden || ""}`}
                size="sm"
            >
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-500">
                        Indica al cliente cómo debe enviar el producto de vuelta (dirección, courier, plazo, etc.)
                    </p>
                    <textarea
                        value={instrucciones}
                        onChange={(e) => setInstrucciones(e.target.value)}
                        rows={4}
                        placeholder="Ej: Envía el producto a través de Olva Courier a la siguiente dirección..."
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-red-400 resize-none"
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setApproveModal(null)}>
                            Cancelar
                        </Button>
                        <Button
                            loading={approveMutation.isPending}
                            onClick={() =>
                                approveMutation.mutate({ id: approveModal.id, instrucciones_admin: instrucciones })
                            }
                        >
                            Confirmar aprobación
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal: rechazar */}
            <Modal
                isOpen={!!rejectModal}
                onClose={() => setRejectModal(null)}
                title={`Rechazar devolución — #${rejectModal?.codigo_orden || ""}`}
                size="sm"
            >
                <div className="flex flex-col gap-4">
                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        placeholder="Explica brevemente por qué se rechaza (el cliente lo verá)..."
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-red-400 resize-none"
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setRejectModal(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            loading={rejectMutation.isPending}
                            onClick={() =>
                                rejectMutation.mutate({ id: rejectModal.id, respuesta_admin: rejectReason })
                            }
                        >
                            Confirmar rechazo
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}