import { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Modal from "../components/ui/Modal.jsx";
import Input from "../components/ui/Input.jsx";
import { formatPrice } from "../utils/formatPrice.js";
import { useForm } from "react-hook-form";
import { adminAPI, getImageUrl } from "../api/admin.api.js";
import VariantImagesManager from "../components/admin/VariantImagesManager.jsx";


const STATUS_BADGE = {
  activo: "green",
  inactivo: "gray",
  agotado: "red",
  borrador: "yellow",
};

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: result, isLoading } = useQuery({
    queryKey: ["admin-products", page, search],
    queryFn: () =>
      adminAPI.getProducts({ page, limit: 15, search, estado: "" }),
    select: (res) => res,
  });

  const products = result?.data || [];
  const meta = result?.meta || {};

  const deleteMutation = useMutation({
    mutationFn: adminAPI.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Producto eliminado");
    },
    onError: (err) => toast.error(err.message || "Error al eliminar"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, estado }) => adminAPI.changeStatus(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Estado actualizado");
    },
    onError: (err) => toast.error(err.message || "Error al actualizar"),
  });

  const handleEdit = async (product) => {
    try {
      console.log("📦 Editando producto ID:", product.id);
      const response = await adminAPI.getProduct(product.id);
      console.log("📦 Producto completo:", response.data);

      // ✅ Establecer el producto completo en el estado
      setEditProduct(response.data);
      setShowModal(true);
    } catch (error) {
      console.error("Error al cargar producto:", error);
      toast.error("Error al cargar el producto");
    }
  };

  const handleNew = () => {
    setEditProduct(null);
    setShowModal(true);
  };
  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar este producto?"))
      deleteMutation.mutate(id);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Productos</h1>
          <p className="text-sm text-gray-500">
            {meta.total || 0} productos en total
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus size={16} /> Nuevo producto
        </Button>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <Spinner />
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Producto
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Categoría
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Precio
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Stock
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Estado
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Ventas
                  </th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {products.map((product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {/* ✅ Buscar imagen base en product.images */}
                            {(() => {
                              const baseImage = product.images?.find(img => !img.variant_id);
                              const imageUrl = baseImage?.url || product.imagen_principal;
                              return imageUrl ? (
                                <img
                                  src={getImageUrl(imageUrl)}
                                  alt={product.nombre}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package size={16} className="text-gray-300" />
                                </div>
                              );
                            })()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 line-clamp-1">
                              {product.nombre}
                            </p>
                            <p className="text-xs text-gray-400">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {product.categoria}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-red-500">
                          {formatPrice(product.precio_oferta || product.precio_base)}
                        </p>
                        {product.precio_oferta && (
                          <p className="text-xs text-gray-400 line-through">
                            {formatPrice(product.precio_base)}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-medium ${product.stock_total < 10 ? "text-red-500" : "text-gray-700"}`}
                        >
                          {product.stock_total}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={STATUS_BADGE[product.estado]}>
                          {product.estado}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {product.ventas_count}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              statusMutation.mutate({
                                id: product.id,
                                estado:
                                  product.estado === "activo"
                                    ? "inactivo"
                                    : "activo",
                              })
                            }
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                            title={
                              product.estado === "activo"
                                ? "Desactivar"
                                : "Activar"
                            }
                          >
                            {product.estado === "activo" ? (
                              <EyeOff size={15} className="text-gray-400" />
                            ) : (
                              <Eye size={15} className="text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit size={15} className="text-blue-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={15} className="text-red-500" />
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
          <div className="flex justify-between items-center p-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Página {meta.page} de {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      <ProductModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        product={editProduct}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-products"] });
          setShowModal(false);
        }}
      />
    </div>
  );
}

// ── Modal de producto ─────────────────────────────────────
function ProductModal({ isOpen, onClose, product, onSuccess }) {
  const [uploadingImages, setUploadingImages] = useState(false);
  const [baseImages, setBaseImages] = useState([]); const [atributos, setAtributos] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [variantAttrs, setVariantAttrs] = useState(["Talla"]);

  // ✅ PRIMERO: useForm
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: "",
      descripcion: "",
      sku: "",
      precio_base: "",
      stock_total: "",
      estado: "borrador",
      es_destacado: false,
      es_nuevo: false,
    },
  });

  // ✅ useQuery para categorías
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: adminAPI.getCategories,
    select: (res) => res.data,
  });

  // ✅ useEffect para resetear el formulario
  useEffect(() => {
    if (product) {
      console.log("🔄 Resetear formulario con producto:", product);

      reset({
        nombre: product.nombre || "",
        descripcion: product.descripcion || "",
        descripcion_corta: product.descripcion_corta || "",
        category_id: product.category_id || "",
        sku: product.sku || "",
        precio_base: product.precio_base || "",
        precio_oferta: product.precio_oferta || "",
        stock_total: product.stock_total || "",
        estado: product.estado || "borrador",
        es_destacado: product.es_destacado === 1,
        es_nuevo: product.es_nuevo === 1,
      });

      // Cargar SOLO imágenes base
      if (product.images && product.images.length > 0) {
        const base = product.images.filter(img => !img.variant_id);
        setBaseImages(base.map(img => img.url));
      } else if (product.imagen_principal) {
        setBaseImages([product.imagen_principal]);
      } else {
        setBaseImages([]);
      }

      // Cargar atributos existentes
      if (product.atributos && product.atributos.length > 0) {
        setAtributos(product.atributos);
      } else {
        setAtributos([]);
      }
    }
  }, [product, reset]);

  // useEffect para actualizar variantes cuando llega el producto
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      console.log("🔄 Actualizando variantes desde product:", product.variants);
      const nuevasVariantes = product.variants.map((v) => ({
        id: v.id,
        sku_variante: v.sku_variante || "",
        opciones: typeof v.opciones === "string" ? JSON.parse(v.opciones) : v.opciones || {},
        precio_extra: Number(v.precio_extra) || 0,
        stock: v.stock || 0,
        imagen_url: v.imagen_url || "",
        activo: v.activo !== undefined ? v.activo : 1,
      }));
      setVariantes(nuevasVariantes);

      if (nuevasVariantes.length > 0 && Object.keys(nuevasVariantes[0].opciones).length > 0) {
        setVariantAttrs(Object.keys(nuevasVariantes[0].opciones));
      }
    } else {
      // ✅ Si el producto NO tiene variantes, asegurar que variantes esté vacío
      setVariantes([]);
      setVariantAttrs(["Talla"]);
    }
  }, [product]);


  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (!files.length) return;
    if (baseImages.length + files.length > 6) {
      toast.error("Máximo 6 imágenes por producto");
      return;
    }

    // ✅ LOG: Ver resolución ANTES de subir
    files.forEach((file) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        console.log(`📸 [ANTES DE SUBIR] ${file.name}`);
        console.log(`   Resolución: ${img.naturalWidth} × ${img.naturalHeight} px`);
        console.log(`   Peso: ${(file.size / 1024).toFixed(1)} kB`);
        console.log(`   Tipo: ${file.type}`);
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
    });

    setUploadingImages(true);
    try {
      const uploadPromises = files.map((file) => {
        const formData = new FormData();
        formData.append("image", file);
        return adminAPI.uploadImage(formData);
      });

      const responses = await Promise.all(uploadPromises);

      const cleanUrls = responses.map((r, idx) => {
        let url = r.data.url;
        url = url.replace(/\/upload\/[^/]*?(v\d+)/, "/upload/$1");

        // ✅ LOG: Ver URL y resolución DESPUÉS de subir
        console.log(`✅ [DESPUÉS DE SUBIR] Imagen ${idx + 1}`);
        console.log(`   URL final: ${url}`);
        console.log(`   Respuesta completa:`, r.data);

        // Ver resolución de la imagen ya subida en Cloudinary
        const imgCheck = new Image();
        imgCheck.onload = () => {
          console.log(`   Resolución en servidor: ${imgCheck.naturalWidth} × ${imgCheck.naturalHeight} px`);
        };
        imgCheck.src = url;

        return url;
      });

      setBaseImages((prev) => [...prev, ...cleanUrls]);
      toast.success(`${files.length} imagen(es) subida(s)`);
    } catch (err) {
      toast.error("Error al subir imágenes");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setBaseImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index, direction) => {
    const newImages = [...baseImages];

    const target = index + direction;
    if (target < 0 || target >= newImages.length) return;
    [newImages[index], newImages[target]] = [
      newImages[target],
      newImages[index],
    ];
    setBaseImages(newImages);
  };

  // Funciones para atributos
  const addAtributo = () => {
    setAtributos([...atributos, { atributo: "", valor: "" }]);
  };

  const removeAtributo = (index) => {
    setAtributos(atributos.filter((_, i) => i !== index));
  };

  const updateAtributo = (index, field, value) => {
    const nuevos = [...atributos];
    nuevos[index][field] = value;
    setAtributos(nuevos);
  };

  // Funciones para variantes
  const addVariantAttr = () => {
    setVariantAttrs([...variantAttrs, ""]);
  };

  const updateVariantAttr = (index, value) => {
    const nuevos = [...variantAttrs];
    nuevos[index] = value;
    setVariantAttrs(nuevos);
  };

  const removeVariantAttr = (index) => {
    if (variantAttrs.length <= 1) return;
    setVariantAttrs(variantAttrs.filter((_, i) => i !== index));
  };

  const addVariante = () => {
    // Solo agregar si variantAttrs tiene valores válidos
    const attrs = variantAttrs.filter(attr => attr && attr.trim() !== '');
    if (attrs.length === 0) {
      toast.error("Primero agrega tipos de variación (ej: Talla, Color)");
      return;
    }

    const opciones = {};
    attrs.forEach((attr) => {
      opciones[attr] = "";
    });

    setVariantes([
      ...variantes,
      {
        id: null,
        sku_variante: "",
        opciones,
        precio_extra: 0,
        stock: 0,
        imagen_url: "",
        activo: 1,
      },
    ]);
  };
  const removeVariante = (index) => {
    setVariantes(variantes.filter((_, i) => i !== index));
  };

  const updateVariante = (index, field, value) => {
    const nuevos = [...variantes];
    if (field.startsWith("opcion_")) {
      const attrName = field.replace("opcion_", "");
      nuevos[index].opciones[attrName] = value;
    } else {
      nuevos[index][field] = value;
    }
    setVariantes(nuevos);
  };

  const mutation = useMutation({
    mutationFn: (data) =>
      product
        ? adminAPI.updateProduct(product.id, data)
        : adminAPI.createProduct(data),
    onSuccess: (res) => {
      const responseData = res.data || res;

      toast.success(product ? "Producto actualizado" : "Producto creado");

      // ✅ Actualizar los IDs de las variantes después de crear o actualizar
      if (responseData?.variants) {
        const updatedVariants = variantes.map((v, idx) => {
          const updatedVariant = responseData.variants.find(rv =>
            v.id === rv.id || (v.opciones.Color === rv.opciones?.Color && v.opciones.Talla === rv.opciones?.Talla)
          );
          return {
            ...v,
            id: updatedVariant?.id || v.id,
          };
        });
        setVariantes(updatedVariants);
      }

      reset();
      setBaseImages([]);
      setAtributos([]);
      setVariantes([]);
      setVariantAttrs(["Talla"]);
      onSuccess();
    },
    onError: (err) => toast.error(err.message || "Error al guardar"),
  });

  const onSubmit = (data) => {
    const atributosFiltrados = atributos.filter((a) => a.atributo && a.valor);

    // Filtrar URLs válidas
    const imagenesUrls = baseImages.filter(
      (url) =>
        url &&
        typeof url === "string" &&
        url.trim() !== ""
    );

    const submitData = {
      nombre: data.nombre,
      descripcion: data.descripcion || "",
      descripcion_corta: data.descripcion_corta || data.descripcion || "",
      category_id: Number(data.category_id),
      precio_base: Number(data.precio_base),
      precio_oferta: data.precio_oferta ? Number(data.precio_oferta) : null,
      sku: data.sku,
      stock_total: Number(data.stock_total),
      estado: data.estado || "activo",
      es_destacado: data.es_destacado ? 1 : 0,
      es_nuevo: data.es_nuevo ? 1 : 0,
      imagenes: imagenesUrls,
    };

    if (atributosFiltrados.length > 0) {
      submitData.atributos = atributosFiltrados;
    }

    // ✅ Enviar variantes SOLO si tienen opciones válidas
    if (variantes.length > 0) {
      const variantesValidas = variantes
        .filter((v) => Object.values(v.opciones).some((val) => val && val.trim() !== ''))
        .map((v) => ({
          id: v.id || undefined,
          sku_variante: v.sku_variante || undefined,
          opciones: v.opciones,
          precio_extra: v.precio_extra || 0,
          stock: v.stock || 0,
          imagen_url: v.imagen_url || null,
          activo: v.activo !== undefined ? v.activo : 1,
        }));

      if (variantesValidas.length > 0) {
        submitData.variantes = variantesValidas;
      }
    }

    mutation.mutate(submitData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? "Editar producto" : "Nuevo producto"}
      size="lg"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <div className="sm:col-span-2">
          <Input
            label="Nombre del producto"
            placeholder="Ej: Vestido Floral Verano"
            error={errors.nombre?.message}
            {...register("nombre", { required: "El nombre es requerido" })}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            rows={4}
            placeholder="Descripción detallada del producto..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-400 resize-none"
            {...register("descripcion")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-400"
            {...register("category_id", { required: true })}
          >
            <option value="">Seleccionar...</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="SKU"
          placeholder="Ej: VFV-001"
          error={errors.sku?.message}
          {...register("sku", { required: "El SKU es requerido" })}
        />

        <Input
          label="Precio base (S/)"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.precio_base?.message}
          {...register("precio_base", { required: "El precio es requerido" })}
        />

        <Input
          label="Precio oferta (S/) — opcional"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("precio_oferta")}
        />

        <Input
          label="Stock total"
          type="number"
          placeholder="0"
          {...register("stock_total", { required: true })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-400"
            {...register("estado")}
          >
            <option value="borrador">Borrador</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="agotado">Agotado</option>
          </select>
        </div>

        {/* ── Imágenes múltiples ── */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Imágenes del producto
              <span className="text-gray-400 font-normal ml-1">
                ({baseImages.length}/6)
              </span>
            </label>
            {baseImages.length > 0 && (
              <span className="text-xs text-gray-400">
                La primera imagen es la principal
              </span>
            )}
          </div>

          {baseImages.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {baseImages.map((url, i) => (
                <div key={i} className="relative group aspect-square">
                  <img
                    src={url}
                    alt={`Imagen ${i + 1}`}
                    className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                  />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1 rounded font-bold">
                      Principal
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(i, -1)}
                      disabled={i === 0}
                      className="p-1 bg-white/80 rounded text-gray-700 disabled:opacity-30 hover:bg-white text-xs"
                      title="Mover izquierda"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="p-1 bg-red-500 rounded text-white hover:bg-red-600 text-xs"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(i, 1)}
                      disabled={i === baseImages.length - 1}
                      className="p-1 bg-white/80 rounded text-gray-700 disabled:opacity-30 hover:bg-white text-xs"
                      title="Mover derecha"
                    >
                      →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {baseImages.length < 6 && (
            <label className="cursor-pointer block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-400 transition">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Upload size={20} className="text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">
                  {uploadingImages
                    ? "Subiendo imágenes..."
                    : `Click para subir (máx. ${6 - baseImages.length} más)`}
                </p>
              </div>
            </label>
          )}
        </div>

        {/* ── Atributos dinámicos ── */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Atributos / Especificaciones
            </label>
            <button
              type="button"
              onClick={addAtributo}
              className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
            >
              <Plus size={14} /> Agregar
            </button>
          </div>

          {atributos.length === 0 && (
            <p className="text-xs text-gray-400 mb-2">
              Ej: Material, Talla, Color, Garantía, Batería...
            </p>
          )}

          <div className="flex flex-col gap-2">
            {atributos.map((attr, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Atributo (ej: Material)"
                  value={attr.atributo}
                  onChange={(e) =>
                    updateAtributo(i, "atributo", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-400"
                />
                <input
                  type="text"
                  placeholder="Valor (ej: Algodón)"
                  value={attr.valor}
                  onChange={(e) => updateAtributo(i, "valor", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-400"
                />
                <button
                  type="button"
                  onClick={() => removeAtributo(i)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Variantes dinámicas ── */}
        <div className="sm:col-span-2 border-t border-gray-100 pt-5 mt-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-700">
                Variantes del producto
              </h3>
              <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {variantes.length}{" "}
                {variantes.length === 1 ? "variante" : "variantes"}
              </span>
            </div>
            <button
              type="button"
              onClick={addVariante}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition"
            >
              <Plus size={13} />
              Agregar variante
            </button>
          </div>

          {/* Tipos de variación */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-600">
                Tipos de variación
              </p>
              <span className="text-xs text-gray-400">
                Ej: Talla, Color, Material
              </span>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {variantAttrs.map((attr, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full pl-3 pr-1.5 py-1 shadow-sm"
                >
                  <input
                    type="text"
                    value={attr}
                    placeholder="Tipo..."
                    onChange={(e) => updateVariantAttr(i, e.target.value)}
                    className="bg-transparent outline-none text-sm text-gray-700 w-16 min-w-0"
                  />
                  {variantAttrs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariantAttr(i)}
                      className="w-4 h-4 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 transition"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addVariantAttr}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 hover:border-gray-400 rounded-full px-3 py-1 transition"
              >
                <Plus size={11} />
                Agregar tipo
              </button>
            </div>
          </div>

          {/* Lista de variantes */}
          {variantes.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl bg-gray-50">
              <Package size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-medium">
                Sin variantes aún
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Agrega variantes para definir tallas, colores u otras opciones
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {variantes.map((variante, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-500">
                        Variante #{i + 1}
                      </span>
                      {Object.values(variante.opciones).some((v) => v) && (
                        <span className="text-xs text-gray-400">
                          —{" "}
                          {Object.entries(variante.opciones)
                            .filter(([, v]) => v)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariante(i)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                      title="Eliminar variante"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Campos */}
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {variantAttrs.map(
                      (attr) =>
                        attr && (
                          <div key={attr} className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">
                              {attr}
                            </label>
                            <input
                              type="text"
                              placeholder={`Ej: M, Rojo...`}
                              value={variante.opciones[attr] || ""}
                              onChange={(e) =>
                                updateVariante(
                                  i,
                                  `opcion_${attr}`,
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition bg-gray-50 focus:bg-white"
                            />
                          </div>
                        ),
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">
                        SKU variante
                      </label>
                      <input
                        type="text"
                        placeholder="Auto o manual"
                        value={variante.sku_variante}
                        onChange={(e) =>
                          updateVariante(i, "sku_variante", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition bg-gray-50 focus:bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">
                        Precio extra
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                          S/
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={variante.precio_extra}
                          onChange={(e) =>
                            updateVariante(
                              i,
                              "precio_extra",
                              Number(e.target.value),
                            )
                          }
                          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">
                        Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={variante.stock}
                        onChange={(e) =>
                          updateVariante(i, "stock", Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>
                  {/* ✅ SECCIÓN DE IMÁGENES POR VARIANTE - Solo mostrar si la variante tiene ID */}
                  <div className="px-4 pb-4">
                    {variante.id ? (
                      <VariantImagesManager
                        variantId={variante.id}
                        variantName={
                          Object.entries(variante.opciones)
                            .filter(([, v]) => v)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ") || `Variante ${i + 1}`
                        }
                      />
                    ) : (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-600">
                          ⚠️ Guarda el producto primero para poder subir imágenes a esta variante.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addVariante}
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-dashed border-gray-300 hover:border-red-300 hover:bg-red-50 hover:text-red-500 text-gray-400 text-sm rounded-xl transition"
              >
                <Plus size={15} />
                Agregar otra variante
              </button>
            </div>
          )}
        </div>

        <div className="sm:col-span-2 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="accent-red-500"
              {...register("es_destacado")}
            />
            Producto destacado
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="accent-red-500"
              {...register("es_nuevo")}
            />
            Producto nuevo
          </label>
        </div>

        <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {product ? "Guardar cambios" : "Crear producto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}