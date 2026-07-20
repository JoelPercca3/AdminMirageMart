import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { adminAPI } from "../api/admin.api.js";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import Input from "../components/ui/Input.jsx";
import Spinner from "../components/ui/Spinner.jsx";

const TIPO_BADGE = {
    variante: { bg: "bg-blue-100", text: "text-blue-700", label: "Variante (afecta stock)" },
    spec: { bg: "bg-gray-100", text: "text-gray-700", label: "Especificación (filtro)" },
};

export default function AttributesPage() {
    const [showModal, setShowModal] = useState(false);
    const [editAttr, setEditAttr] = useState(null);
    const queryClient = useQueryClient();

    const { data: attributes, isLoading } = useQuery({
        queryKey: ["admin-attributes"],
        queryFn: adminAPI.getAttributes,
        select: (res) => res.data,
    });

    const deleteMutation = useMutation({
        mutationFn: adminAPI.deleteAttribute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-attributes"] });
            toast.success("Atributo eliminado");
        },
        onError: (err) => toast.error(err.message || "Error al eliminar"),
    });

    const handleEdit = (attr) => { setEditAttr(attr); setShowModal(true); };
    const handleNew = () => { setEditAttr(null); setShowModal(true); };
    const handleDelete = (id, nombre) => {
        if (confirm(`¿Eliminar "${nombre}"? Los productos que lo usan conservarán el valor como texto libre, pero dejará de funcionar como filtro.`))
            deleteMutation.mutate(id);
    };
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Atributos</h1>
                    <p className="text-sm text-gray-500">
                        {attributes?.length || 0} atributos definidos — reutilizables entre categorías
                    </p>
                </div>
                <Button onClick={handleNew}>
                    <Plus size={16} /> Nuevo atributo
                </Button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <Spinner />
                ) : !attributes?.length ? (
                    <div className="text-center py-16">
                        <Tag size={48} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500">No hay atributos creados</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Ej: "Modelo compatible", "Tipo de conector", "Potencia"
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-3 px-4 text-gray-500 font-medium">Nombre</th>
                                <th className="text-left py-3 px-4 text-gray-500 font-medium">Tipo</th>
                                <th className="text-left py-3 px-4 text-gray-500 font-medium">Filtrable</th>
                                <th className="text-right py-3 px-4 text-gray-500 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attributes.map((attr) => {
                                const badge = TIPO_BADGE[attr.tipo] || TIPO_BADGE.spec;
                                return (
                                    <motion.tr
                                        key={attr.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="border-b border-gray-50 hover:bg-gray-50 transition"
                                    >
                                        <td className="py-3 px-4 font-medium text-gray-800">{attr.nombre}</td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-500">
                                            {attr.filtrable ? "Sí" : "No"}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => handleEdit(attr)} className="p-1.5 hover:bg-blue-50 rounded-lg transition">
                                                    <Edit size={15} className="text-blue-500" />
                                                </button>
                                                <button onClick={() => handleDelete(attr.id, attr.nombre)} className="p-1.5 hover:bg-red-50 rounded-lg transition">
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

            <AttributeModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditAttr(null); }}
                attribute={editAttr}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["admin-attributes"] });
                    setShowModal(false);
                    setEditAttr(null);
                }}
            />
        </div>
    );
}

function AttributeModal({ isOpen, onClose, attribute, onSuccess }) {
    const { register, handleSubmit, reset } = useForm({
        defaultValues: attribute || { nombre: "", tipo: "spec", filtrable: true },
    });

    useState(() => {
        if (isOpen) reset(attribute || { nombre: "", tipo: "spec", filtrable: true });
    }, [isOpen, attribute, reset]);

    const mutation = useMutation({
        mutationFn: (data) =>
            attribute ? adminAPI.updateAttribute(attribute.id, data) : adminAPI.createAttribute(data),
        onSuccess: () => {
            toast.success(attribute ? "Atributo actualizado" : "Atributo creado");
            onSuccess();
        },
        onError: (err) => toast.error(err.message || "Error al guardar"),
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={attribute ? "Editar atributo" : "Nuevo atributo"}>
            <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-4">
                <Input
                    label="Nombre"
                    placeholder='Ej: "Modelo compatible", "Potencia"'
                    {...register("nombre", { required: true })}
                />
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800"
                        {...register("tipo")}
                    >
                        <option value="spec">Especificación (filtro, no afecta stock)</option>
                        <option value="variante">Variante (afecta stock, como Talla/Color)</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                        Por ahora el flujo de "Variante" solo soporta Talla/Color de forma nativa —
                        crea este atributo aquí para catalogarlo, pero su uso completo como variante
                        se habilitará más adelante.
                    </p>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" {...register("filtrable")} /> Mostrar como filtro en el sidebar
                </label>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" loading={mutation.isPending}>
                        {attribute ? "Guardar" : "Crear"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}