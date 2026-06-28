import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Grid3x3 } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { adminAPI } from "../api/admin.api.js";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import Input from "../components/ui/Input.jsx";
import Spinner from "../components/ui/Spinner.jsx";

export default function CategoriesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading, isFetching } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: adminAPI.getCategories,
    select: (res) => res.data,
    placeholderData: (previousData) => previousData, // Mantiene los datos previos
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const deleteMutation = useMutation({
    mutationFn: adminAPI.deleteCategory,
    onSuccess: () => {
      // Invalidar pero mantener los datos previos mientras se actualiza
      queryClient.invalidateQueries({
        queryKey: ["admin-categories"],
        refetchType: 'all',
      });
      toast.success("Categoría eliminada");
    },
    onError: (err) => toast.error(err.message || "Error al eliminar"),
  });

  const handleEdit = (cat) => {
    setEditCat(cat);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditCat(null);
    setShowModal(true);
  };

  // Construir el árbol para mostrar con indentación
  const buildTreeWithLevel = (cats, parentId = null, level = 0) => {
    const result = [];
    cats
      ?.filter((cat) => cat.parent_id === parentId)
      .forEach((cat) => {
        result.push({ ...cat, level });
        result.push(...buildTreeWithLevel(cats, cat.id, level + 1));
      });
    return result;
  };

  // Usar los datos disponibles, incluso si están cargando
  const flatCategories = buildTreeWithLevel(categories || []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Categorías</h1>
          <p className="text-sm text-gray-500">
            {categories?.length || 0} categorías en total
            {isFetching && !isLoading && (
              <span className="ml-2 text-xs text-gray-400">(Actualizando...)</span>
            )}
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus size={16} /> Nueva categoría
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <Spinner />
        ) : flatCategories.length === 0 ? (
          <div className="text-center py-16">
            <Grid3x3 size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No hay categorías</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">
                  Nombre
                </th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">
                  Slug
                </th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">
                  Productos
                </th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">
                  Estado
                </th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {flatCategories.map((cat) => (
                <motion.tr
                  key={cat.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-gray-50 hover:bg-gray-50 transition"
                >
                  <td className="py-3 px-4">
                    <span
                      style={{ paddingLeft: `${cat.level * 20}px` }}
                      className="flex items-center gap-2"
                    >
                      {cat.level > 0 && (
                        <span className="text-gray-300">└</span>
                      )}
                      <span className="font-medium text-gray-800">
                        {cat.nombre}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 font-mono text-xs">
                    {cat.slug}
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {cat.total_productos || 0}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                        }`}
                    >
                      {cat.activo ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit size={15} className="text-blue-500" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("¿Eliminar esta categoría?"))
                            deleteMutation.mutate(cat.id);
                        }}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={15} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CategoryModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          // Limpiar el estado de edición al cerrar
          setEditCat(null);
        }}
        category={editCat}
        categories={categories || []}
        onSuccess={() => {
          // Invalidar la query para que se actualice
          queryClient.invalidateQueries({
            queryKey: ["admin-categories"],
            refetchType: 'all',
          });
          setShowModal(false);
          setEditCat(null);
        }}
      />
    </div>
  );
}

function CategoryModal({ isOpen, onClose, category, categories, onSuccess }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: category || { activo: 1 },
  });

  // Resetear el formulario cuando se abre con una categoría diferente
  useState(() => {
    if (isOpen) {
      reset(category || { activo: 1 });
    }
  }, [isOpen, category, reset]);

  // Obtener categorías principales (sin padre) para el select
  const mainCategories = categories.filter((c) => !c.parent_id);

  const mutation = useMutation({
    mutationFn: (data) =>
      category
        ? adminAPI.updateCategory(category.id, data)
        : adminAPI.createCategory(data),
    onSuccess: () => {
      toast.success(category ? "Categoría actualizada" : "Categoría creada");
      reset();
      onSuccess();
    },
    onError: (err) => toast.error(err.message || "Error al guardar"),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? "Editar categoría" : "Nueva categoría"}
    >
      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="flex flex-col gap-4"
      >
        <Input
          label="Nombre"
          placeholder="Ej: Moda Mujer"
          {...register("nombre", { required: true })}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría padre (opcional)
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-400"
            {...register("parent_id")}
          >
            <option value="">Sin categoría padre</option>
            {mainCategories
              .filter((c) => c.id !== category?.id)
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
          </select>
        </div>
        <Input
          label="URL imagen (opcional)"
          placeholder="https://..."
          {...register("imagen_url")}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-400"
            {...register("activo")}
          >
            <option value={1}>Activa</option>
            <option value={0}>Inactiva</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {category ? "Guardar" : "Crear"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}