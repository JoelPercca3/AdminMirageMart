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
  const [baseImages, setBaseImages] = useState([]);
  const [atributos, setAtributos] = useState([]);
  const [variantes, setVariantes] = useState([]);

  // ── Colores y tallas disponibles ──
  const COLORES_PRESET = ["Negro", "Blanco", "Azul", "Rojo", "Verde", "Rosado", "Gris", "Beige", "Morado", "Naranja", "Amarillo", "Café"];
  const TALLAS_PRESET = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "40"];

  const [selectedColores, setSelectedColores] = useState([]);
  const [selectedTallas, setSelectedTallas] = useState([]);
  const [customColor, setCustomColor] = useState("");
  const [customTalla, setCustomTalla] = useState("");
  const [usaColores, setUsaColores] = useState(false);
  const [usaTallas, setUsaTallas] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      nombre: "", descripcion: "", sku: "",
      precio_base: "", stock_total: "", estado: "borrador",
      es_destacado: false, es_nuevo: false,
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: adminAPI.getCategories,
    select: (res) => res.data,
  });

  // ── Cargar producto al editar ──
  useEffect(() => {
    if (product) {
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

      const base = product.images?.filter(img => !img.variant_id) ?? [];
      setBaseImages(base.map(img => img.url));
      setAtributos(product.atributos || []);

      if (product.variants?.length > 0) {
        const vars = product.variants.map(v => {
          const opts = typeof v.opciones === "string" ? JSON.parse(v.opciones) : v.opciones || {};
          const normOpts = {};
          Object.entries(opts).forEach(([k, val]) => {
            normOpts[k.charAt(0).toUpperCase() + k.slice(1)] = val;
          });
          return {
            id: v.id,
            sku_variante: v.sku_variante || "",
            opciones: normOpts,
            precio_extra: Number(v.precio_extra) || 0,
            stock: v.stock || 0,
            imagen_url: v.imagen_url || "",
            activo: v.activo !== undefined ? v.activo : 1,
          };
        });
        setVariantes(vars);

        // Reconstruir colores y tallas seleccionados
        const coloresSet = new Set(vars.map(v => v.opciones.Color).filter(Boolean));
        const tallasSet = new Set(vars.map(v => v.opciones.Talla).filter(Boolean));
        if (coloresSet.size > 0) { setUsaColores(true); setSelectedColores([...coloresSet]); }
        if (tallasSet.size > 0) { setUsaTallas(true); setSelectedTallas([...tallasSet]); }
      } else {
        setVariantes([]);
        setSelectedColores([]);
        setSelectedTallas([]);
        setUsaColores(false);
        setUsaTallas(false);
      }
    } else {
      reset();
      setBaseImages([]);
      setAtributos([]);
      setVariantes([]);
      setSelectedColores([]);
      setSelectedTallas([]);
      setUsaColores(false);
      setUsaTallas(false);
    }
  }, [product, reset]);

  // ── Generar combinaciones automáticamente ──
  useEffect(() => {
    if (!usaColores && !usaTallas) {
      setVariantes([]);
      return;
    }

    const colores = usaColores && selectedColores.length > 0 ? selectedColores : [null];
    const tallas = usaTallas && selectedTallas.length > 0 ? selectedTallas : [null];

    const combinaciones = [];
    colores.forEach(color => {
      tallas.forEach(talla => {
        const opciones = {};
        if (color) opciones.Color = color;
        if (talla) opciones.Talla = talla;

        // Buscar si ya existe esta variante para preservar stock/sku/id
        const existing = variantes.find(v =>
          (!color || v.opciones.Color === color) &&
          (!talla || v.opciones.Talla === talla)
        );

        combinaciones.push({
          id: existing?.id || null,
          sku_variante: existing?.sku_variante || "",
          opciones,
          precio_extra: existing?.precio_extra || 0,
          stock: existing?.stock || 0,
          imagen_url: existing?.imagen_url || "",
          activo: 1,
        });
      });
    });

    setVariantes(combinaciones);
  }, [selectedColores, selectedTallas, usaColores, usaTallas]);

  const toggleColor = (color) => {
    setSelectedColores(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const toggleTalla = (talla) => {
    setSelectedTallas(prev =>
      prev.includes(talla) ? prev.filter(t => t !== talla) : [...prev, talla]
    );
  };

  const addCustomColor = () => {
    const c = customColor.trim();
    if (!c) return;
    const formatted = c.charAt(0).toUpperCase() + c.slice(1);
    if (!selectedColores.includes(formatted)) setSelectedColores(prev => [...prev, formatted]);
    setCustomColor("");
  };

  const addCustomTalla = () => {
    const t = customTalla.trim().toUpperCase();
    if (!t) return;
    if (!selectedTallas.includes(t)) setSelectedTallas(prev => [...prev, t]);
    setCustomTalla("");
  };

  const updateVariante = (index, field, value) => {
    const nuevos = [...variantes];
    nuevos[index][field] = value;
    setVariantes(nuevos);
  };

  // ── Imágenes ──
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (baseImages.length + files.length > 6) { toast.error("Máximo 6 imágenes"); return; }
    setUploadingImages(true);
    try {
      const responses = await Promise.all(files.map(file => {
        const fd = new FormData();
        fd.append("image", file);
        return adminAPI.uploadImage(fd);
      }));
      setBaseImages(prev => [...prev, ...responses.map(r => r.data.url)]);
      toast.success(`${files.length} imagen(es) subida(s)`);
    } catch { toast.error("Error al subir imágenes"); }
    finally { setUploadingImages(false); }
  };

  const removeImage = (i) => setBaseImages(prev => prev.filter((_, idx) => idx !== i));
  const moveImage = (i, dir) => {
    const imgs = [...baseImages];
    const t = i + dir;
    if (t < 0 || t >= imgs.length) return;
    [imgs[i], imgs[t]] = [imgs[t], imgs[i]];
    setBaseImages(imgs);
  };

  const addAtributo = () => setAtributos([...atributos, { atributo: "", valor: "" }]);
  const removeAtributo = (i) => setAtributos(atributos.filter((_, idx) => idx !== i));
  const updateAtributo = (i, field, value) => {
    const n = [...atributos]; n[i][field] = value; setAtributos(n);
  };

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data) => product ? adminAPI.updateProduct(product.id, data) : adminAPI.createProduct(data),
    onSuccess: () => {
      toast.success(product ? "Producto actualizado" : "Producto creado");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      onSuccess();
    },
    onError: (err) => toast.error(err.message || "Error al guardar"),
  });

  const onSubmit = (data) => {
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
      imagenes: baseImages.filter(u => u && u.trim() !== ""),
      atributos: atributos.filter(a => a.atributo && a.valor),
    };

    if (variantes.length > 0) {
      submitData.variantes = variantes
        .filter(v => Object.values(v.opciones).some(val => val && val.trim() !== ""))
        .map(v => ({
          id: v.id || undefined,
          sku_variante: v.sku_variante || undefined,
          opciones: v.opciones,
          precio_extra: v.precio_extra || 0,
          stock: v.stock || 0,
          imagen_url: v.imagen_url || null,
          activo: 1,
        }));
    }

    mutation.mutate(submitData);
  };

  const COLOR_HEX = {
    negro: "#1a1a1a", blanco: "#f5f5f5", azul: "#3182ce", rojo: "#e53e3e",
    verde: "#38a169", rosado: "#ed64a6", gris: "#a0aec0", beige: "#c8a876",
    morado: "#805ad5", naranja: "#ed8936", amarillo: "#ecc94b", café: "#7b341e",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? "Editar producto" : "Nuevo producto"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* ── Información básica ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Nombre del producto" placeholder="Ej: Polo Oversize Hombre" error={errors.nombre?.message}
              {...register("nombre", { required: "El nombre es requerido" })} />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea rows={3} placeholder="Descripción detallada..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-400 resize-none"
              {...register("descripcion")} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-400"
              {...register("category_id", { required: true })}>
              <option value="">Seleccionar...</option>
              {categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
            </select>
          </div>

          <Input label="SKU" placeholder="Ej: POL-001" error={errors.sku?.message}
            {...register("sku", { required: "El SKU es requerido" })} />

          <Input label="Precio base (S/)" type="number" step="0.01" placeholder="0.00"
            error={errors.precio_base?.message}
            {...register("precio_base", { required: "El precio es requerido" })} />

          <Input label="Precio oferta (S/) — opcional" type="number" step="0.01" placeholder="0.00"
            {...register("precio_oferta")} />

          <Input label="Stock total" type="number" placeholder="0"
            {...register("stock_total", { required: true })} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-400"
              {...register("estado")}>
              <option value="borrador">Borrador</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="agotado">Agotado</option>
            </select>
          </div>
        </div>

        {/* ── Imágenes ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Imágenes del producto <span className="text-gray-400 font-normal">({baseImages.length}/6)</span>
            </label>
            {baseImages.length > 0 && <span className="text-xs text-gray-400">La primera imagen es la principal</span>}
          </div>

          {baseImages.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {baseImages.map((url, i) => (
                <div key={i} className="relative group aspect-square">
                  <img src={url} alt={`Imagen ${i + 1}`} className="w-full h-full object-cover rounded-lg border-2 border-gray-200" />
                  {i === 0 && <span className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1 rounded font-bold">Principal</span>}
                  <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                    <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="p-1 bg-white/80 rounded text-xs disabled:opacity-30">←</button>
                    <button type="button" onClick={() => removeImage(i)} className="p-1 bg-red-500 rounded text-white text-xs">✕</button>
                    <button type="button" onClick={() => moveImage(i, 1)} disabled={i === baseImages.length - 1} className="p-1 bg-white/80 rounded text-xs disabled:opacity-30">→</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {baseImages.length < 6 && (
            <label className="cursor-pointer block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-400 transition">
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                <Upload size={20} className="text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">{uploadingImages ? "Subiendo..." : `Click para subir (máx. ${6 - baseImages.length} más)`}</p>
              </div>
            </label>
          )}
        </div>

        {/* ── Atributos ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Atributos / Especificaciones</label>
            <button type="button" onClick={addAtributo} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
              <Plus size={14} /> Agregar
            </button>
          </div>
          {atributos.length === 0 && <p className="text-xs text-gray-400 mb-2">Ej: Material, Talla, Color, Garantía, Batería...</p>}
          <div className="flex flex-col gap-2">
            {atributos.map((attr, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" placeholder="Atributo (ej: Material)" value={attr.atributo}
                  onChange={e => updateAtributo(i, "atributo", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-400" />
                <input type="text" placeholder="Valor (ej: Algodón)" value={attr.valor}
                  onChange={e => updateAtributo(i, "valor", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-400" />
                <button type="button" onClick={() => removeAtributo(i)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Variantes estilo Shein ── */}
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Variantes del producto</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">

            {/* Colores */}
            <div className={`border rounded-xl p-4 transition ${usaColores ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={usaColores} onChange={e => { setUsaColores(e.target.checked); if (!e.target.checked) setSelectedColores([]); }}
                    className="accent-red-500 w-4 h-4" />
                  <span className="text-sm font-semibold text-gray-700">Colores</span>
                </label>
                {usaColores && <span className="text-xs text-gray-400">{selectedColores.length} seleccionados</span>}
              </div>

              {usaColores && (
                <>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {COLORES_PRESET.map(color => (
                      <button key={color} type="button" onClick={() => toggleColor(color)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border-2 transition ${selectedColores.includes(color) ? "border-gray-800 bg-white shadow-sm" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                        <span className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                          style={{ backgroundColor: COLOR_HEX[color.toLowerCase()] || "#cbd5e0" }} />
                        {color}
                        {selectedColores.includes(color) && <span className="text-green-500 font-bold">✓</span>}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Otro color..." value={customColor}
                      onChange={e => setCustomColor(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomColor())}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-red-400" />
                    <button type="button" onClick={addCustomColor} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition">
                      + Agregar
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Tallas */}
            <div className={`border rounded-xl p-4 transition ${usaTallas ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={usaTallas} onChange={e => { setUsaTallas(e.target.checked); if (!e.target.checked) setSelectedTallas([]); }}
                    className="accent-red-500 w-4 h-4" />
                  <span className="text-sm font-semibold text-gray-700">Tallas</span>
                </label>
                {usaTallas && <span className="text-xs text-gray-400">{selectedTallas.length} seleccionadas</span>}
              </div>

              {usaTallas && (
                <>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {TALLAS_PRESET.map(talla => (
                      <button key={talla} type="button" onClick={() => toggleTalla(talla)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition ${selectedTallas.includes(talla) ? "border-gray-800 bg-gray-800 text-white" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}>
                        {talla}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Otra talla..." value={customTalla}
                      onChange={e => setCustomTalla(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomTalla())}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-red-400" />
                    <button type="button" onClick={addCustomTalla} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition">
                      + Agregar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabla de combinaciones */}
          {variantes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-600">
                  {variantes.length} combinación{variantes.length !== 1 ? "es" : ""} generada{variantes.length !== 1 ? "s" : ""}
                </p>
                <button type="button"
                  onClick={() => setVariantes(prev => prev.map(v => ({ ...v, stock: prev[0]?.stock || 0 })))}
                  className="text-xs text-blue-500 hover:underline">
                  Igualar todo el stock
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {variantes[0]?.opciones?.Color !== undefined && (
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">Color</th>
                      )}
                      {variantes[0]?.opciones?.Talla !== undefined && (
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">Talla</th>
                      )}
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">Stock</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">Precio extra (S/)</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">SKU variante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantes.map((v, i) => (
                      <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        {v.opciones.Color !== undefined && (
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                                style={{ backgroundColor: COLOR_HEX[v.opciones.Color?.toLowerCase()] || "#cbd5e0" }} />
                              <span className="text-sm font-medium text-gray-700">{v.opciones.Color}</span>
                            </div>
                          </td>
                        )}
                        {v.opciones.Talla !== undefined && (
                          <td className="py-2 px-3">
                            <span className="inline-block bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded">
                              {v.opciones.Talla}
                            </span>
                          </td>
                        )}
                        <td className="py-2 px-3">
                          <input type="number" min="0" value={v.stock}
                            onChange={e => updateVariante(i, "stock", Number(e.target.value))}
                            className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100" />
                        </td>
                        <td className="py-2 px-3">
                          <div className="relative w-24">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">S/</span>
                            <input type="number" step="0.01" value={v.precio_extra}
                              onChange={e => updateVariante(i, "precio_extra", Number(e.target.value))}
                              className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100" />
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <input type="text" placeholder="Auto" value={v.sku_variante}
                            onChange={e => updateVariante(i, "sku_variante", e.target.value)}
                            className="w-28 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Imágenes por variante (solo al editar) */}
          {product && variantes.filter(v => v.id).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-600 mb-3">Imágenes por variante</p>
              <div className="flex flex-col gap-3">
                {variantes.filter(v => v.id).map((v, i) => (
                  <VariantImagesManager
                    key={v.id}
                    variantId={v.id}
                    variantName={Object.entries(v.opciones).filter(([, val]) => val).map(([k, val]) => `${k}: ${val}`).join(" · ") || `Variante ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Opciones ── */}
        <div className="flex items-center gap-4 border-t border-gray-100 pt-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="accent-red-500" {...register("es_destacado")} />
            Producto destacado
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="accent-red-500" {...register("es_nuevo")} />
            Producto nuevo
          </label>
        </div>

        {/* ── Botones ── */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>
            {product ? "Guardar cambios" : "Crear producto"}
          </Button>
        </div>

      </form>
    </Modal>
  );
}