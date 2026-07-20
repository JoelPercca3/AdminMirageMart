import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Image as ImageIcon, Upload, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { adminAPI } from "../api/admin.api.js";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import Input from "../components/ui/Input.jsx";
import Spinner from "../components/ui/Spinner.jsx";

const TIPO_LABELS = {
    hero: { label: "Hero (carrusel grande)", bg: "bg-blue-100", text: "text-blue-700" },
    promo: { label: "Promo (tarjeta pequeña)", bg: "bg-purple-100", text: "text-purple-700" },
};

export default function BannersPage() {
    const [showModal, setShowModal] = useState(false);
    const [editBanner, setEditBanner] = useState(null);
    const queryClient = useQueryClient();

    const { data: banners, isLoading } = useQuery({
        queryKey: ["admin-banners"],
        queryFn: adminAPI.getAllBanners,
        select: (res) => res.data,
    });

    const deleteMutation = useMutation({
        mutationFn: adminAPI.deleteBanner,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
            toast.success("Banner eliminado");
        },
        onError: (err) => toast.error(err.message || "Error al eliminar"),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, activo }) => adminAPI.updateBanner(id, { activo }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
            toast.success("Estado actualizado");
        },
        onError: (err) => toast.error(err.message || "Error al actualizar"),
    });

    const handleEdit = (banner) => { setEditBanner(banner); setShowModal(true); };
    const handleNew = () => { setEditBanner(null); setShowModal(true); };
    const handleDelete = (id) => {
        if (confirm("¿Eliminar este banner?")) deleteMutation.mutate(id);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Banners</h1>
                    <p className="text-sm text-gray-500">
                        {banners?.length || 0} banners — carrusel del home y tarjetas promo
                    </p>
                </div>
                <Button onClick={handleNew}>
                    <Plus size={16} /> Nuevo banner
                </Button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <Spinner />
                ) : !banners?.length ? (
                    <div className="text-center py-16">
                        <ImageIcon size={48} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500">No hay banners creados</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-3 px-4 text-gray-500 font-medium">Imagen</th>
                                <th className="text-left py-3 px-4 text-gray-500 font-medium">Título</th>
                                <th className="text-left py-3 px-4 text-gray-500 font-medium">Tipo</th>
                                <th className="text-left py-3 px-4 text-gray-500 font-medium">Orden</th>
                                <th className="text-left py-3 px-4 text-gray-500 font-medium">Estado</th>
                                <th className="text-right py-3 px-4 text-gray-500 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banners.map((banner) => {
                                const tipoInfo = TIPO_LABELS[banner.tipo] || TIPO_LABELS.hero;
                                return (
                                    <motion.tr
                                        key={banner.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="border-b border-gray-50 hover:bg-gray-50 transition"
                                    >
                                        <td className="py-2 px-4">
                                            <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                                <img src={banner.imagen_url} alt={banner.titulo} className="w-full h-full object-cover" />
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="font-medium text-gray-800 line-clamp-1">{banner.titulo}</p>
                                            {banner.subtitulo && (
                                                <p className="text-xs text-gray-400 line-clamp-1">{banner.subtitulo}</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipoInfo.bg} ${tipoInfo.text}`}>
                                                {tipoInfo.label}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-500">{banner.orden}</td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${banner.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                                    }`}
                                            >
                                                {banner.activo ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => statusMutation.mutate({ id: banner.id, activo: banner.activo ? 0 : 1 })}
                                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                                                    title={banner.activo ? "Desactivar" : "Activar"}
                                                >
                                                    {banner.activo ? <EyeOff size={15} className="text-gray-500" /> : <Eye size={15} className="text-gray-500" />}
                                                </button>
                                                <button onClick={() => handleEdit(banner)} className="p-1.5 hover:bg-blue-50 rounded-lg transition">
                                                    <Edit size={15} className="text-blue-500" />
                                                </button>
                                                <button onClick={() => handleDelete(banner.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition">
                                                    <Trash2 size={15} className="text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <BannerModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditBanner(null); }}
                banner={editBanner}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
                    setShowModal(false);
                    setEditBanner(null);
                }}
            />
        </div>
    );
}

function BannerModal({ isOpen, onClose, banner, onSuccess }) {
    const [imagenUrl, setImagenUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const queryClient = useQueryClient();

    const { register, handleSubmit, reset } = useForm({
        defaultValues: banner || { tipo: "hero", orden: 0, activo: 1 },
    });

    useState(() => {
        if (isOpen) {
            reset(banner || { tipo: "hero", orden: 0, activo: 1 });
            setImagenUrl(banner?.imagen_url || "");
        }
    }, [isOpen, banner, reset]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("image", file);
            const res = await adminAPI.uploadImage(fd);
            setImagenUrl(res.data.url);
            toast.success("Imagen subida");
        } catch {
            toast.error("Error al subir imagen");
        } finally {
            setUploading(false);
        }
    };

    const mutation = useMutation({
        mutationFn: (data) =>
            banner ? adminAPI.updateBanner(banner.id, data) : adminAPI.createBanner(data),
        onSuccess: () => {
            toast.success(banner ? "Banner actualizado" : "Banner creado");
            onSuccess();
        },
        onError: (err) => toast.error(err.message || "Error al guardar"),
    });

    const onSubmit = (data) => {
        if (!imagenUrl) {
            toast.error("Debes subir una imagen");
            return;
        }
        mutation.mutate({
            ...data,
            imagen_url: imagenUrl,
            orden: Number(data.orden) || 0,
            activo: data.activo ? 1 : 0,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={banner ? "Editar banner" : "Nuevo banner"} size="lg">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800"
                        {...register("tipo")}
                    >
                        <option value="hero">Hero (carrusel grande del home)</option>
                        <option value="promo">Promo (tarjeta pequeña)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Imagen</label>
                    {imagenUrl && (
                        <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200 mb-2">
                            <img src={imagenUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <label className="cursor-pointer block">
                        <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-500 transition">
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            <Upload size={18} className="text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">{uploading ? "Subiendo..." : imagenUrl ? "Cambiar imagen" : "Subir imagen"}</p>
                        </div>
                    </label>
                </div>

                <Input label="Tag (opcional)" placeholder="Ej: 🔥 Oferta especial" {...register("tag")} />
                <Input label="Título" placeholder="Ej: ¡Hasta 70% OFF!" {...register("titulo", { required: true })} />
                <Input label="Subtítulo (opcional)" placeholder="Ej: En miles de productos seleccionados" {...register("subtitulo")} />
                <Input label="Texto del botón (opcional)" placeholder="Ej: Ver ofertas" {...register("boton_texto")} />
                <Input label="Link (ruta interna)" placeholder="Ej: /products?sort=precio:asc" {...register("link")} />

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Orden" type="number" placeholder="0" {...register("orden")} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800"
                            {...register("activo")}
                        >
                            <option value={1}>Activo</option>
                            <option value={0}>Inactivo</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" loading={mutation.isPending}>
                        {banner ? "Guardar" : "Crear"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}