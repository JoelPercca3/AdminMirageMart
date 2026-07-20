import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { adminAPI } from "../api/admin.api.js";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Modal from "../components/ui/Modal.jsx";
import { formatPrice } from "../utils/formatPrice.js";
import { formatDateShort } from "../utils/formatDate.js";

const STATUS_BADGE = { pendiente: "yellow", aprobado: "green", rechazado: "red" };
const MOTIVO_LABELS = {
    cambio_de_opinion: "Cambió de opinión",
    ya_no_lo_necesito: "Ya no lo necesita",
    demora_envio: "Se demoró en llegar",
    producto_incorrecto: "Pedido incorrecto",
    otro: "Otro motivo",
};

export default function RefundRequestsPage() {
    const [estado, setEstado] = useState("pendiente");
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const queryClient = useQueryClient();

    const { data: result, isLoading } = useQuery({
        queryKey: ["refund-requests", estado],
        queryFn: () => adminAPI.getRefundRequests({ estado, limit: 20 }),
        select: (res) => res,
    });

    const requests = result?.data || [];

    const approveMutation = useMutation({
        mutationFn: (id) => adminAPI.approveRefundRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["refund-requests"] });
            toast.success("Reembolso aprobado y procesado");
        },
        onError: (err) => toast.error(err.message || "Error al aprobar"),
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, respuesta_admin }) => adminAPI.rejectRefundRequest(id, respuesta_admin),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["refund-requests"] });
            setRejectModal(null);
            setRejectReason("");
            toast.success("Solicitud rechazada");
        },
        onError: (err) => toast.error(err.message || "Error al rechazar"),
    });

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-xl font-bold text-gray-800">Solicitudes de reembolso</h1>
                <p className="text-sm text-gray-500">{requests.length} solicitudes</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3">
                <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400"
                >
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="aprobado">Aprobados</option>
                    <option value="rechazado">Rechazados</option>
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
                                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Cliente</th>
                                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Motivo</th>
                                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Monto</th>
                                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Fecha</th>
                                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Estado</th>
                                    <th className="text-right py-3 px-4 text-gray-500 font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((r) => (
                                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="py-3 px-4 font-mono font-medium">#{r.codigo_orden}</td>
                                        <td className="py-3 px-4">
                                            <p className="font-medium text-gray-800">{r.cliente}</p>
                                            <p className="text-xs text-gray-400">{r.email}</p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <p>{MOTIVO_LABELS[r.motivo] || r.motivo}</p>
                                            {r.comentario && (
                                                <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{r.comentario}</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-red-500">
                                            {formatPrice(r.monto_solicitado)}
                                        </td>
                                        <td className="py-3 px-4 text-gray-500">{formatDateShort(r.created_at)}</td>
                                        <td className="py-3 px-4">
                                            <Badge variant={STATUS_BADGE[r.estado]}>{r.estado}</Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            {r.estado === "pendiente" && (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-green-500 text-green-600 hover:bg-green-50"
                                                        loading={approveMutation.isPending}
                                                        onClick={() => approveMutation.mutate(r.id)}
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
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={!!rejectModal}
                onClose={() => setRejectModal(null)}
                title={`Rechazar solicitud — #${rejectModal?.codigo_orden || ""}`}
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