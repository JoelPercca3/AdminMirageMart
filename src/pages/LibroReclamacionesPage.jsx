import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    ClipboardList,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Modal from "../components/ui/Modal.jsx";
import { adminAPI } from "../api/admin.api.js";
import { formatDate } from "../utils/formatDate.js";

function StatCard({ icon: Icon, label, value, meta, metaDown = false, iconBg = "#f3f4f6", iconColor = "#6b7280" }) {
    return (
        <div className="bg-white rounded-xl p-4 flex flex-col gap-3" style={{ border: "0.5px solid #e5e7eb" }}>
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9ca3af" }}>{label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
                    <Icon size={15} style={{ color: iconColor }} />
                </div>
            </div>
            <div>
                <p className="text-[22px] font-semibold" style={{ color: "#111827", lineHeight: 1 }}>{value}</p>
                {meta && <p className="text-[11px] mt-1" style={{ color: metaDown ? "#ef4444" : "#10b981" }}>{meta}</p>}
            </div>
        </div>
    );
}

// Calcula días hábiles restantes (aprox., no descuenta feriados)
function businessDaysLeft(createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    let daysPassed = 0;
    const cursor = new Date(created);
    while (cursor < now) {
        cursor.setDate(cursor.getDate() + 1);
        const day = cursor.getDay();
        if (day !== 0 && day !== 6) daysPassed++;
    }
    return 15 - daysPassed;
}

const FILTERS = [
    { key: "", label: "Todos" },
    { key: "pendiente", label: "Pendientes" },
    { key: "respondido", label: "Respondidos" },
];

export default function LibroReclamacionesPage() {
    const [search, setSearch] = useState("");
    const [estadoFilter, setEstadoFilter] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(null);
    const [respuestaText, setRespuestaText] = useState("");
    const queryClient = useQueryClient();

    const { data: result, isLoading } = useQuery({
        queryKey: ["admin-libro-reclamaciones", page, search, estadoFilter],
        queryFn: () => adminAPI.getLibroReclamaciones({ page, limit: 15, search, estado: estadoFilter }),
        select: (res) => res,
    });

    const records = result?.data ?? [];
    const meta = result?.meta ?? {};

    const respondMutation = useMutation({
        mutationFn: ({ id, respuesta }) => adminAPI.responderLibroReclamacion(id, respuesta),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-libro-reclamaciones"] });
            toast.success("Respuesta enviada al consumidor");
            setSelected(null);
            setRespuestaText("");
        },
        onError: (err) => toast.error(err.message || "Error al responder"),
    });

    const handleOpen = (record) => {
        setSelected(record);
        setRespuestaText(record.respuesta || "");
    };

    const pendientesVencenPronto = records.filter(
        (r) => r.estado === "pendiente" && businessDaysLeft(r.created_at) <= 3,
    ).length;
    const totalPendientes = records.filter((r) => r.estado === "pendiente").length;

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-[18px] font-semibold" style={{ color: "#111827" }}>Libro de reclamaciones</h1>
                    <p className="text-[12px] mt-0.5" style={{ color: "#9ca3af" }}>
                        {meta.total ?? 0} registros — recuerda: 15 días hábiles para responder
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <StatCard icon={ClipboardList} label="Total registros" value={meta.total ?? 0} meta="reclamos y quejas" iconBg="#f3f4f6" iconColor="#6b7280" />
                <StatCard
                    icon={Clock}
                    label="Pendientes (página actual)"
                    value={totalPendientes}
                    meta={totalPendientes > 0 ? "Requieren respuesta" : "Todo al día"}
                    metaDown={totalPendientes > 0}
                    iconBg={totalPendientes > 0 ? "#fef2f2" : "#f0fdf4"}
                    iconColor={totalPendientes > 0 ? "#dc2626" : "#16a34a"}
                />
                <StatCard
                    icon={AlertTriangle}
                    label="Por vencer (≤3 días hábiles)"
                    value={pendientesVencenPronto}
                    meta={pendientesVencenPronto > 0 ? "¡Responde ya!" : "Sin urgencias"}
                    metaDown={pendientesVencenPronto > 0}
                    iconBg={pendientesVencenPronto > 0 ? "#fef2f2" : "#f0fdf4"}
                    iconColor={pendientesVencenPronto > 0 ? "#dc2626" : "#16a34a"}
                />
            </div>

            <div className="bg-white rounded-xl overflow-hidden" style={{ border: "0.5px solid #e5e7eb" }}>
                <div className="flex items-center gap-2 px-4 py-3 flex-wrap" style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                    <div className="relative max-w-[260px] flex-1">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o código..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-lg outline-none"
                            style={{ border: "0.5px solid #e5e7eb", background: "#f9fafb", color: "#374151" }}
                        />
                    </div>
                    <div className="flex gap-1 ml-auto">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => { setEstadoFilter(f.key); setPage(1); }}
                                className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                                style={estadoFilter === f.key
                                    ? { background: "#111827", color: "#fff" }
                                    : { background: "#fff", color: "#6b7280", border: "0.5px solid #e5e7eb" }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-16 flex items-center justify-center"><Spinner /></div>
                ) : records.length === 0 ? (
                    <div className="text-center py-16">
                        <ClipboardList size={40} className="mx-auto mb-3" style={{ color: "#e5e7eb" }} />
                        <p className="text-[13px]" style={{ color: "#9ca3af" }}>No se encontraron registros</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]" style={{ borderCollapse: "collapse" }}>
                            <thead style={{ background: "#f9fafb" }}>
                                <tr>
                                    {["Código", "Tipo", "Consumidor", "Fecha", "Plazo", "Estado", ""].map((h, i) => (
                                        <th key={i} className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9ca3af", borderBottom: "0.5px solid #f3f4f6" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {records.map((r) => {
                                        const daysLeft = r.estado === "pendiente" ? businessDaysLeft(r.created_at) : null;
                                        return (
                                            <motion.tr
                                                key={r.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="cursor-pointer"
                                                style={{ borderBottom: "0.5px solid #f9fafb" }}
                                                onClick={() => handleOpen(r)}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                            >
                                                <td className="py-2.5 px-4 text-[12px] font-mono font-semibold" style={{ color: "#111827" }}>{r.codigo}</td>
                                                <td className="py-2.5 px-4">
                                                    <Badge variant={r.tipo === "reclamo" ? "red" : "yellow"}>{r.tipo === "reclamo" ? "Reclamo" : "Queja"}</Badge>
                                                </td>
                                                <td className="py-2.5 px-4">
                                                    <p className="text-[12px]" style={{ color: "#111827" }}>{r.nombre_completo}</p>
                                                    <p className="text-[11px]" style={{ color: "#9ca3af" }}>{r.email}</p>
                                                </td>
                                                <td className="py-2.5 px-4 text-[12px]" style={{ color: "#6b7280" }}>{formatDate(r.created_at)}</td>
                                                <td className="py-2.5 px-4 text-[12px]">
                                                    {r.estado === "pendiente" ? (
                                                        <span style={{ color: daysLeft <= 3 ? "#dc2626" : "#6b7280", fontWeight: daysLeft <= 3 ? 700 : 400 }}>
                                                            {daysLeft > 0 ? `${daysLeft} días hábiles` : "Vencido"}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#9ca3af" }}>—</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-4">
                                                    <Badge variant={r.estado === "respondido" ? "green" : "gray"}>
                                                        {r.estado === "respondido" ? "Respondido" : "Pendiente"}
                                                    </Badge>
                                                </td>
                                                <td className="py-2.5 px-4">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpen(r); }}
                                                        className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                                                        style={{ color: "#9ca3af" }}
                                                    >
                                                        <Eye size={13} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}

                {meta.totalPages > 1 && (
                    <div className="flex justify-between items-center px-4 py-3" style={{ borderTop: "0.5px solid #f3f4f6" }}>
                        <p className="text-[12px]" style={{ color: "#9ca3af" }}>Página {meta.page} de {meta.totalPages}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`${selected?.tipo === "reclamo" ? "Reclamo" : "Queja"} — ${selected?.codigo}`} size="lg">
                {selected && (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-xs text-gray-400 mb-1">Consumidor</p>
                                <p className="text-sm font-semibold text-gray-800">{selected.nombre_completo}</p>
                                <p className="text-xs text-gray-500">{selected.email}</p>
                                {selected.telefono && <p className="text-xs text-gray-500">{selected.telefono}</p>}
                                {selected.domicilio && <p className="text-xs text-gray-500">{selected.domicilio}</p>}
                                {!!selected.es_menor_edad && (
                                    <p className="text-xs text-amber-600 font-medium mt-1">
                                        Menor de edad — Apoderado: {selected.nombre_apoderado}
                                    </p>
                                )}
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-xs text-gray-400 mb-1">Pedido / Producto</p>
                                <p className="text-sm text-gray-700">{selected.numero_pedido || "—"}</p>
                                <p className="text-xs text-gray-500">{selected.bien_contratado || "No especificado"}</p>
                                {selected.monto_reclamado && (
                                    <p className="text-xs text-gray-500">Monto reclamado: S/ {Number(selected.monto_reclamado).toFixed(2)}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Detalle</p>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{selected.detalle}</p>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Pedido del consumidor</p>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{selected.pedido_consumidor}</p>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Tu respuesta</p>
                            <textarea
                                rows={4}
                                value={respuestaText}
                                onChange={(e) => setRespuestaText(e.target.value)}
                                disabled={selected.estado === "respondido"}
                                placeholder="Escribe la respuesta que recibirá el consumidor por email..."
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-gray-800 outline-none resize-none disabled:bg-gray-50 disabled:text-gray-500"
                            />
                        </div>

                        {selected.estado === "respondido" ? (
                            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-xl p-3">
                                <CheckCircle2 size={16} />
                                Respondido el {formatDate(selected.respondido_at)}
                            </div>
                        ) : (
                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Cerrar</Button>
                                <Button
                                    size="sm"
                                    loading={respondMutation.isPending}
                                    onClick={() => respondMutation.mutate({ id: selected.id, respuesta: respuestaText })}
                                    disabled={respuestaText.trim().length < 5}
                                >
                                    Enviar respuesta
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}