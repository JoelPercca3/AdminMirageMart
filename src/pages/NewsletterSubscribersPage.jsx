import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mail, UserCheck, UserX } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { adminAPI } from "../api/admin.api.js";
import { formatDate } from "../utils/formatDate.js";

function StatCard({ icon: Icon, label, value, meta, iconBg = "#f3f4f6", iconColor = "#6b7280" }) {
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
                {meta && <p className="text-[11px] mt-1" style={{ color: "#10b981" }}>{meta}</p>}
            </div>
        </div>
    );
}

const FILTERS = [
    { key: "", label: "Todos" },
    { key: "1", label: "Activos" },
    { key: "0", label: "Inactivos" },
];

export default function NewsletterSubscribersPage() {
    const [search, setSearch] = useState("");
    const [activoFilter, setActivoFilter] = useState("");
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();

    const { data: result, isLoading } = useQuery({
        queryKey: ["admin-newsletter-subscribers", page, search, activoFilter],
        queryFn: () => adminAPI.getNewsletterSubscribers({ page, limit: 20, search, activo: activoFilter }),
        select: (res) => res,
    });

    const subscribers = result?.data ?? [];
    const meta = result?.meta ?? {};

    const statusMutation = useMutation({
        mutationFn: ({ id, activo }) => adminAPI.setNewsletterSubscriberStatus(id, activo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-newsletter-subscribers"] });
            toast.success("Estado actualizado");
        },
        onError: (err) => toast.error(err.message || "Error al actualizar"),
    });

    const activosCount = subscribers.filter((s) => s.activo).length;

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-[18px] font-semibold" style={{ color: "#111827" }}>Suscriptores del newsletter</h1>
                    <p className="text-[12px] mt-0.5" style={{ color: "#9ca3af" }}>{meta.total ?? 0} suscriptores en total</p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <StatCard icon={Mail} label="Total suscriptores" value={meta.total ?? 0} meta="desde el footer" iconBg="#f3f4f6" iconColor="#6b7280" />
                <StatCard icon={UserCheck} label="Activos (página actual)" value={activosCount} meta="reciben promociones" iconBg="#f0fdf4" iconColor="#16a34a" />
                <StatCard icon={UserX} label="Inactivos (página actual)" value={subscribers.length - activosCount} iconBg="#f3f4f6" iconColor="#6b7280" />
            </div>

            <div className="bg-white rounded-xl overflow-hidden" style={{ border: "0.5px solid #e5e7eb" }}>
                <div className="flex items-center gap-2 px-4 py-3 flex-wrap" style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                    <div className="relative max-w-[260px] flex-1">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }} />
                        <input
                            type="text"
                            placeholder="Buscar por email..."
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
                                onClick={() => { setActivoFilter(f.key); setPage(1); }}
                                className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                                style={activoFilter === f.key
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
                ) : subscribers.length === 0 ? (
                    <div className="text-center py-16">
                        <Mail size={40} className="mx-auto mb-3" style={{ color: "#e5e7eb" }} />
                        <p className="text-[13px]" style={{ color: "#9ca3af" }}>No se encontraron suscriptores</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px]" style={{ borderCollapse: "collapse" }}>
                            <thead style={{ background: "#f9fafb" }}>
                                <tr>
                                    {["Email", "Fecha de suscripción", "Estado", ""].map((h, i) => (
                                        <th key={i} className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9ca3af", borderBottom: "0.5px solid #f3f4f6" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {subscribers.map((s) => (
                                        <motion.tr
                                            key={s.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            style={{ borderBottom: "0.5px solid #f9fafb" }}
                                        >
                                            <td className="py-2.5 px-4 text-[12px]" style={{ color: "#111827" }}>{s.email}</td>
                                            <td className="py-2.5 px-4 text-[12px]" style={{ color: "#6b7280" }}>{formatDate(s.created_at)}</td>
                                            <td className="py-2.5 px-4">
                                                <Badge variant={s.activo ? "green" : "gray"}>{s.activo ? "Activo" : "Inactivo"}</Badge>
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <button
                                                    onClick={() => statusMutation.mutate({ id: s.id, activo: !s.activo })}
                                                    className="text-[12px] font-medium hover:underline"
                                                    style={{ color: s.activo ? "#dc2626" : "#16a34a" }}
                                                >
                                                    {s.activo ? "Desactivar" : "Activar"}
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
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
        </div>
    );
}