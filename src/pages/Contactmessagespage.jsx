import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Mail,
    MailOpen,
    MessageCircle,
    Inbox,
    CheckCircle2,
    Eye,
    X,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Modal from "../components/ui/Modal.jsx";
import { adminAPI } from "../api/admin.api.js";
import { formatDate } from "../utils/formatDate.js";

// ── Stat Card (mismo patrón que ProductsPage admin) ─────────
function StatCard({ icon: Icon, label, value, meta, metaDown = false, iconBg = "#f3f4f6", iconColor = "#6b7280" }) {
    return (
        <div
            className="bg-white rounded-xl p-4 flex flex-col gap-3"
            style={{ border: "0.5px solid #e5e7eb" }}
        >
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9ca3af" }}>
                    {label}
                </span>
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: iconBg }}
                >
                    <Icon size={15} style={{ color: iconColor }} />
                </div>
            </div>
            <div>
                <p className="text-[22px] font-semibold" style={{ color: "#111827", lineHeight: 1 }}>
                    {value}
                </p>
                {meta && (
                    <p className="text-[11px] mt-1" style={{ color: metaDown ? "#ef4444" : "#10b981" }}>
                        {meta}
                    </p>
                )}
            </div>
        </div>
    );
}

const FILTERS = [
    { key: "", label: "Todos" },
    { key: "0", label: "No leídos" },
    { key: "1", label: "Leídos" },
];

export default function ContactMessagesPage() {
    const [search, setSearch] = useState("");
    const [leidoFilter, setLeidoFilter] = useState("");
    const [page, setPage] = useState(1);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const queryClient = useQueryClient();

    const { data: result, isLoading } = useQuery({
        queryKey: ["admin-contact-messages", page, search, leidoFilter],
        queryFn: () =>
            adminAPI.getContactMessages({
                page,
                limit: 15,
                search,
                leido: leidoFilter,
            }),
        select: (res) => res,
    });

    const messages = result?.data ?? [];
    const meta = result?.meta ?? {};

    const markReadMutation = useMutation({
        mutationFn: ({ id, leido }) => adminAPI.markContactMessageRead(id, leido),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
        },
        onError: (err) => toast.error(err.message || "Error al actualizar"),
    });

    const handleOpenMessage = (msg) => {
        setSelectedMessage(msg);
        if (!msg.leido) {
            markReadMutation.mutate({ id: msg.id, leido: true });
        }
    };

    const totalNoLeidos = messages.filter((m) => !m.leido).length;

    return (
        <div className="flex flex-col gap-5">

            {/* Page header */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-[18px] font-semibold" style={{ color: "#111827" }}>
                        Mensajes de contacto
                    </h1>
                    <p className="text-[12px] mt-0.5" style={{ color: "#9ca3af" }}>
                        {meta.total ?? 0} mensajes en total
                    </p>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <StatCard
                    icon={Inbox}
                    label="Total mensajes"
                    value={meta.total ?? 0}
                    meta="recibidos"
                    iconBg="#f3f4f6"
                    iconColor="#6b7280"
                />
                <StatCard
                    icon={Mail}
                    label="No leídos (página actual)"
                    value={totalNoLeidos}
                    meta={totalNoLeidos > 0 ? "Requiere atención" : "Todo al día"}
                    metaDown={totalNoLeidos > 0}
                    iconBg={totalNoLeidos > 0 ? "#fef2f2" : "#f0fdf4"}
                    iconColor={totalNoLeidos > 0 ? "#dc2626" : "#16a34a"}
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Leídos (página actual)"
                    value={messages.length - totalNoLeidos}
                    meta="ya revisados"
                    iconBg="#eff6ff"
                    iconColor="#2563eb"
                />
            </div>

            {/* Tabla */}
            <div
                className="bg-white rounded-xl overflow-hidden"
                style={{ border: "0.5px solid #e5e7eb" }}
            >
                {/* Toolbar */}
                <div
                    className="flex items-center gap-2 px-4 py-3 flex-wrap"
                    style={{ borderBottom: "0.5px solid #f3f4f6" }}
                >
                    {/* Buscador */}
                    <div className="relative max-w-[240px] flex-1">
                        <Search
                            size={13}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2"
                            style={{ color: "#9ca3af" }}
                        />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o mensaje..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-lg outline-none transition-colors"
                            style={{
                                border: "0.5px solid #e5e7eb",
                                background: "#f9fafb",
                                color: "#374151",
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#111827";
                                e.target.style.background = "#fff";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e5e7eb";
                                e.target.style.background = "#f9fafb";
                            }}
                        />
                    </div>

                    {/* Filtros de estado */}
                    <div className="flex gap-1 ml-auto">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => { setLeidoFilter(f.key); setPage(1); }}
                                className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                                style={
                                    leidoFilter === f.key
                                        ? { background: "#111827", color: "#fff" }
                                        : { background: "#fff", color: "#6b7280", border: "0.5px solid #e5e7eb" }
                                }
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Contenido */}
                {isLoading ? (
                    <div className="py-16 flex items-center justify-center">
                        <Spinner />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-16">
                        <MessageCircle size={40} className="mx-auto mb-3" style={{ color: "#e5e7eb" }} />
                        <p className="text-[13px]" style={{ color: "#9ca3af" }}>
                            No se encontraron mensajes
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px]" style={{ borderCollapse: "collapse" }}>
                            <thead style={{ background: "#f9fafb" }}>
                                <tr>
                                    {["", "Cliente", "Mensaje", "Fecha", "Estado", ""].map((h, i) => (
                                        <th
                                            key={i}
                                            className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wide"
                                            style={{ color: "#9ca3af", borderBottom: "0.5px solid #f3f4f6" }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {messages.map((msg) => (
                                        <motion.tr
                                            key={msg.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="cursor-pointer"
                                            style={{ borderBottom: "0.5px solid #f9fafb" }}
                                            onClick={() => handleOpenMessage(msg)}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                        >
                                            {/* Ícono leído/no leído */}
                                            <td className="py-2.5 px-4">
                                                {msg.leido ? (
                                                    <MailOpen size={15} style={{ color: "#9ca3af" }} />
                                                ) : (
                                                    <Mail size={15} style={{ color: "#ef4444" }} />
                                                )}
                                            </td>

                                            {/* Cliente */}
                                            <td className="py-2.5 px-4">
                                                <p
                                                    className="text-[12px]"
                                                    style={{ color: "#111827", fontWeight: msg.leido ? 400 : 700 }}
                                                >
                                                    {msg.nombre}
                                                </p>
                                                <p className="text-[11px]" style={{ color: "#9ca3af" }}>
                                                    {msg.email}
                                                </p>
                                            </td>

                                            {/* Mensaje truncado */}
                                            <td className="py-2.5 px-4">
                                                <p className="text-[12px] line-clamp-1" style={{ color: "#6b7280", maxWidth: 320 }}>
                                                    {msg.mensaje}
                                                </p>
                                            </td>

                                            {/* Fecha */}
                                            <td className="py-2.5 px-4 text-[12px]" style={{ color: "#6b7280" }}>
                                                {formatDate(msg.created_at)}
                                            </td>

                                            {/* Estado */}
                                            <td className="py-2.5 px-4">
                                                <Badge variant={msg.leido ? "gray" : "red"}>
                                                    {msg.leido ? "Leído" : "No leído"}
                                                </Badge>
                                            </td>

                                            {/* Acciones */}
                                            <td className="py-2.5 px-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenMessage(msg);
                                                        }}
                                                        className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                                                        style={{ color: "#9ca3af" }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = "#eff6ff";
                                                            e.currentTarget.style.color = "#2563eb";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = "transparent";
                                                            e.currentTarget.style.color = "#9ca3af";
                                                        }}
                                                    >
                                                        <Eye size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Paginación */}
                {meta.totalPages > 1 && (
                    <div
                        className="flex justify-between items-center px-4 py-3"
                        style={{ borderTop: "0.5px solid #f3f4f6" }}
                    >
                        <p className="text-[12px]" style={{ color: "#9ca3af" }}>
                            Página {meta.page} de {meta.totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                Anterior
                            </Button>
                            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de detalle */}
            <Modal
                isOpen={!!selectedMessage}
                onClose={() => setSelectedMessage(null)}
                title="Mensaje de contacto"
                size="md"
            >
                {selectedMessage && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-800">{selectedMessage.nombre}</p>
                                <p className="text-sm text-gray-400">{selectedMessage.email}</p>
                            </div>
                            <Badge variant={selectedMessage.leido ? "gray" : "red"}>
                                {selectedMessage.leido ? "Leído" : "No leído"}
                            </Badge>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {selectedMessage.mensaje}
                            </p>
                        </div>

                        <p className="text-xs text-gray-400">
                            Recibido el {formatDate(selectedMessage.created_at)}
                        </p>

                        <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    markReadMutation.mutate({
                                        id: selectedMessage.id,
                                        leido: !selectedMessage.leido,
                                    });
                                    setSelectedMessage(null);
                                }}
                            >
                                Marcar como {selectedMessage.leido ? "no leído" : "leído"}
                            </Button>
                            <a href={`mailto:${selectedMessage.email}`}>
                                <Button size="sm">Responder por email</Button>
                            </a>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}