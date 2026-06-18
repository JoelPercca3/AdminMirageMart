// admin/src/pages/PromosPage.jsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Megaphone, Send, Tag, Package, Settings, Users, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI } from "../api/admin.api.js";
import Button from "../components/ui/Button.jsx";

// Templates predefinidos
const TEMPLATES = [
    {
        icon: "🔥",
        label: "Flash Sale",
        titulo: "⚡ ¡FLASH SALE! Solo por hoy",
        mensaje: "Hasta 50% de descuento en productos seleccionados. ¡No te lo pierdas!",
        url: "/products?sort=precio:asc",
    },
    {
        icon: "🎉",
        label: "Nuevo producto",
        titulo: "✨ ¡Nuevos productos llegaron!",
        mensaje: "Acaban de llegar productos nuevos a la tienda. ¡Sé el primero en verlos!",
        url: "/products?sort=newest",
    },
    {
        icon: "🚚",
        label: "Envío gratis",
        titulo: "🚚 ¡Envío gratis este fin de semana!",
        mensaje: "Aprovecha el envío gratis en todos tus pedidos. ¡Solo por tiempo limitado!",
        url: "/products",
    },
    {
        icon: "💛",
        label: "Descuento especial",
        titulo: "💛 Tenemos un descuento especial para ti",
        mensaje: "Como cliente especial, te regalamos un cupón exclusivo. ¡Úsalo en tu próxima compra!",
        url: "/products",
    },
];

const TIPO_OPTIONS = [
    { value: "promo", label: "Promoción", icon: Tag, color: "text-orange-500", bg: "bg-orange-50" },
    { value: "sistema", label: "Sistema", icon: Settings, color: "text-gray-500", bg: "bg-gray-100" },
    { value: "pedido", label: "Pedido", icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
];

export default function PromosPage() {
    const [titulo, setTitulo] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [urlAccion, setUrlAccion] = useState("");
    const [tipo, setTipo] = useState("promo");
    const [sent, setSent] = useState(null);

    const mutation = useMutation({
        mutationFn: adminAPI.sendPromo,
        onSuccess: (res) => {
            setSent(res.data?.total || 0);
            toast.success(res.message || "Promoción enviada");
            setTimeout(() => setSent(null), 5000);
        },
        onError: (err) => toast.error(err.message || "Error al enviar"),
    });

    const handleTemplate = (tpl) => {
        setTitulo(tpl.titulo);
        setMensaje(tpl.mensaje);
        setUrlAccion(tpl.url);
        setTipo("promo");
        setSent(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!titulo.trim() || !mensaje.trim()) {
            toast.error("Título y mensaje son requeridos");
            return;
        }
        mutation.mutate({ titulo, mensaje, url_accion: urlAccion || null, tipo });
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Promociones</h1>
                    <p className="text-sm text-gray-500">
                        Envía notificaciones a todos tus clientes
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-4 py-2">
                    <Megaphone size={16} className="text-orange-500" />
                    <span className="text-sm font-medium text-orange-600">Centro de notificaciones</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Formulario ── */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
                        <h2 className="font-semibold text-gray-800">Nueva notificación</h2>

                        {/* Tipo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                            <div className="flex gap-2">
                                {TIPO_OPTIONS.map((opt) => {
                                    const Icon = opt.icon;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setTipo(opt.value)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition ${tipo === opt.value
                                                    ? `border-red-500 ${opt.bg} ${opt.color}`
                                                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                                                }`}
                                        >
                                            <Icon size={14} />
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Título */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Título <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="Ej: ⚡ ¡FLASH SALE! Solo por hoy"
                                maxLength={80}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-400 transition"
                            />
                            <p className="text-xs text-gray-400 mt-1 text-right">{titulo.length}/80</p>
                        </div>

                        {/* Mensaje */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mensaje <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={mensaje}
                                onChange={(e) => setMensaje(e.target.value)}
                                placeholder="Ej: Hasta 50% de descuento en productos seleccionados..."
                                maxLength={200}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-400 transition resize-none"
                            />
                            <p className="text-xs text-gray-400 mt-1 text-right">{mensaje.length}/200</p>
                        </div>

                        {/* URL acción */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL al hacer clic (opcional)
                            </label>
                            <input
                                type="text"
                                value={urlAccion}
                                onChange={(e) => setUrlAccion(e.target.value)}
                                placeholder="Ej: /products o /products?sort=precio:asc"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-400 transition"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Ruta interna de la tienda a donde irá el cliente al tocar la notificación
                            </p>
                        </div>

                        {/* Preview */}
                        {(titulo || mensaje) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Vista previa</label>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex gap-3">
                                    <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                                        <Tag size={16} className="text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{titulo || "Título de la notificación"}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{mensaje || "Mensaje de la notificación"}</p>
                                        <p className="text-xs text-gray-400 mt-1">ahora</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Botón enviar */}
                        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                            <Button
                                type="submit"
                                loading={mutation.isPending}
                                className="flex items-center gap-2"
                            >
                                <Send size={15} />
                                Enviar a todos los clientes
                            </Button>

                            {sent !== null && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 text-green-600 text-sm font-medium"
                                >
                                    <CheckCircle size={16} />
                                    Enviado a {sent} clientes
                                </motion.div>
                            )}
                        </div>
                    </form>
                </div>

                {/* ── Templates ── */}
                <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <h2 className="font-semibold text-gray-800 mb-4">Plantillas rápidas</h2>
                        <div className="flex flex-col gap-2">
                            {TEMPLATES.map((tpl) => (
                                <button
                                    key={tpl.label}
                                    type="button"
                                    onClick={() => handleTemplate(tpl)}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition text-left group"
                                >
                                    <span className="text-2xl">{tpl.icon}</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition">
                                            {tpl.label}
                                        </p>
                                        <p className="text-xs text-gray-400 line-clamp-1">{tpl.titulo}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={16} className="text-blue-500" />
                            <p className="text-sm font-semibold text-blue-700">¿A quién llega?</p>
                        </div>
                        <p className="text-xs text-blue-600 leading-relaxed">
                            La notificación llega a <strong>todos los clientes activos</strong> registrados en la tienda.
                            La verán en la campana 🔔 la próxima vez que entren.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}