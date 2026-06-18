// src/components/admin/VariantImagesManager.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Star, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI, getImageUrl } from "../../api/admin.api.js";

export default function VariantImagesManager({ variantId, variantName }) {
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);

    // Obtener imágenes de la variante
    const { data: imagesData, isLoading } = useQuery({
        queryKey: ["variant-images", variantId],
        queryFn: () => adminAPI.getVariantImages(variantId),
        enabled: !!variantId,
        select: (res) => res.data || [],
    });

    const images = imagesData || [];

    // Subir imagen
    const uploadMutation = useMutation({
        mutationFn: (formData) => adminAPI.uploadVariantImage(variantId, formData),
        onSuccess: () => {
            queryClient.invalidateQueries(["variant-images", variantId]);
            toast.success("Imagen subida correctamente");
        },
        onError: (err) => toast.error(err.message || "Error al subir imagen"),
    });

    // Eliminar imagen
    const deleteMutation = useMutation({
        mutationFn: (imageId) => adminAPI.deleteVariantImage(imageId),
        onSuccess: () => {
            queryClient.invalidateQueries(["variant-images", variantId]);
            toast.success("Imagen eliminada");
        },
    });

    // Establecer como principal
    const setPrimaryMutation = useMutation({
        mutationFn: (imageId) => adminAPI.setVariantImageAsPrimary(imageId),
        onSuccess: () => {
            queryClient.invalidateQueries(["variant-images", variantId]);
            toast.success("Imagen principal actualizada");
        },
    });

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Solo se permiten imágenes");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("La imagen no debe superar 5MB");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("image", file);

        try {
            await uploadMutation.mutateAsync(formData);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-4">
                <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500">
                    Imágenes para {variantName}
                </p>
                <span className="text-xs text-gray-400">
                    {images.length} / 5 imágenes
                </span>
            </div>

            {/* Grid de imágenes existentes */}
            {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                    {images.map((img, idx) => (
                        <motion.div
                            key={img.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200"
                        >
                            <img
                                src={getImageUrl(img.url)}
                                alt={`Variante ${variantId} - ${idx + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Badge de principal */}
                            {img.es_principal === 1 && (
                                <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Star size={8} fill="white" /> Principal
                                </div>
                            )}

                            {/* Overlay con botones */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                {img.es_principal !== 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setPrimaryMutation.mutate(img.id)}
                                        className="p-1.5 bg-yellow-500 rounded-lg text-white hover:bg-yellow-600 transition"
                                        title="Establecer como principal"
                                    >
                                        <Star size={12} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm("¿Eliminar esta imagen?")) {
                                            deleteMutation.mutate(img.id);
                                        }
                                    }}
                                    className="p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600 transition"
                                    title="Eliminar"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Botón de subida */}
            {images.length < 5 && (
                <label className="cursor-pointer block">
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-2 text-center hover:border-red-400 transition bg-gray-50">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                        {uploading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 size={14} className="animate-spin text-gray-400" />
                                <span className="text-xs text-gray-400">Subiendo...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-1">
                                <Upload size={12} className="text-gray-400" />
                                <span className="text-xs text-gray-500">
                                    Subir imagen para esta variante
                                </span>
                            </div>
                        )}
                    </div>
                </label>
            )}
        </div>
    );
}