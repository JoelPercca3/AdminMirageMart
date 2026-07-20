import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Grid3x3, SlidersHorizontal } from "lucide-react";
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
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [attrCategory, setAttrCategory] = useState(null);

  const queryClient = useQueryClient();

  const { data: categories, isLoading, isFetching } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: adminAPI.getCategories,
    select: (res) => res.data,
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: adminAPI.deleteCategory,
    onSuccess: () => {
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

  const handleManageAttributes = (cat) => {
    setAttrCategory(cat);
    setShowAttrModal(true);
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
                      {/* ✅ Botón Gestionar Atributos */}
                      <button
                        onClick={() => handleManageAttributes(cat)}
                        className="p-1.5 hover:bg-purple-50 rounded-lg transition"
                        title="Gestionar atributos"
                      >
                        <SlidersHorizontal size={15} className="text-purple-500" />
                      </button>
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
          setEditCat(null);
        }}
        category={editCat}
        categories={categories || []}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ["admin-categories"],
            refetchType: 'all',
          });
          setShowModal(false);
          setEditCat(null);
        }}
      />

      {/* ✅ Modal de Atributos de Categoría */}
      <CategoryAttributesModal
        isOpen={showAttrModal}
        onClose={() => {
          setShowAttrModal(false);
          setAttrCategory(null);
        }}
        category={attrCategory}
      />
    </div>
  );
}

// ─── MODAL DE CATEGORÍA ──────────────────────────────────────────────────────
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

// ─── MODAL DE ATRIBUTOS DE CATEGORÍA ────────────────────────────────────────
function CategoryAttributesModal({ isOpen, onClose, category }) {
  const queryClient = useQueryClient();

  // Todos los atributos existentes (catálogo maestro)
  const { data: allAttributes } = useQuery({
    queryKey: ["admin-attributes"],
    queryFn: adminAPI.getAttributes,
    select: (res) => res.data,
    enabled: isOpen,
  });

  // Atributos ya asociados a esta categoría
  const { data: categoryAttributes, isLoading } = useQuery({
    queryKey: ["admin-category-attributes", category?.id],
    queryFn: () => adminAPI.getCategoryAttributes(category.id),
    select: (res) => res.data,
    enabled: isOpen && !!category?.id,
  });

  // Modificar la mutación para enviar es_requerido
  const assignMutation = useMutation({
    mutationFn: ({ attribute_id, es_requerido = false }) =>
      adminAPI.assignAttributeToCategory(category.id, {
        attribute_id,
        es_requerido
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-category-attributes", category?.id]
      });
      toast.success("Atributo actualizado correctamente");
    },
    onError: (err) => toast.error(err.message || "Error al actualizar"),
  });

  const removeMutation = useMutation({
    mutationFn: (attributeId) =>
      adminAPI.removeAttributeFromCategory(category.id, attributeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-category-attributes", category?.id]
      });
      toast.success("Atributo removido correctamente");
    },
    onError: (err) => toast.error(err.message || "Error al quitar"),
  });

  // Crear Set y Map para manejar asignación y estado requerido
  const assignedIds = new Set((categoryAttributes || []).map((a) => a.id));
  const requeridoMap = new Map(
    (categoryAttributes || []).map((a) => [a.id, a.es_requerido])
  );

  const toggleAttribute = (attributeId) => {
    if (assignedIds.has(attributeId)) {
      removeMutation.mutate(attributeId);
    } else {
      assignMutation.mutate({
        attribute_id: attributeId,
        es_requerido: false
      });
    }
  };

  // Nueva función para toggle de "Requerido"
  const toggleRequerido = (attributeId, currentValue) => {
    assignMutation.mutate({
      attribute_id: attributeId,
      es_requerido: !currentValue
    });
  };

  if (!category) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Atributos de "${category.nombre}"`}
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs text-gray-500">
          Marca qué atributos aplican a esta categoría. Aparecerán como filtros
          en el sidebar público y como campos al crear productos de esta categoría.
        </p>

        {isLoading ? (
          <Spinner />
        ) : !allAttributes?.length ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            No hay atributos creados todavía. Ve a "Atributos" en el menú para crear uno.
          </p>
        ) : (
          <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
            {allAttributes.map((attr) => {
              const isAssigned = assignedIds.has(attr.id);
              const esRequerido = requeridoMap.get(attr.id);

              return (
                <div
                  key={attr.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    onChange={() => toggleAttribute(attr.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{attr.nombre}</p>
                    <p className="text-xs text-gray-400">
                      {attr.tipo === "variante"
                        ? "Variante (afecta stock)"
                        : "Especificación (filtro)"}
                    </p>
                  </div>
                  {isAssigned && (
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!esRequerido}
                        onChange={() => toggleRequerido(attr.id, esRequerido)}
                      />
                      Requerido
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="button" onClick={onClose}>Listo</Button>
        </div>
      </div>
    </Modal>
  );
}