import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Save, Plus, Edit } from "lucide-react";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { adminAPI } from "../api/admin.api.js";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Modal from "../components/ui/Modal.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { formatPrice } from "../utils/formatPrice.js";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [shippingModal, setShippingModal] = useState(false);
  const [editShipping, setEditShipping] = useState(null);

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: adminAPI.getSettings,
    select: (res) => res.data,
  });

  const { data: shipping, isLoading: loadingShipping } = useQuery({
    queryKey: ["admin-shipping"],
    queryFn: adminAPI.getShipping,
    select: (res) => res.data,
  });

  const settingsMutation = useMutation({
    mutationFn: adminAPI.updateSettings,
    onSuccess: () => toast.success("Configuración guardada"),
    onError: (err) => toast.error(err.message || "Error al guardar"),
  });

  const { register, handleSubmit } = useForm({ values: settings || {} });

  const TABS = ["general", "envios"];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-gray-800">Configuración</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition capitalize ${activeTab === tab
              ? "border-red-500 text-red-500"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            {tab === "general" ? "General" : "Métodos de envío"}
          </button>
        ))}
      </div>

      {/* General */}
      {activeTab === "general" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {loadingSettings ? (
            <Spinner />
          ) : (
            <form
              onSubmit={handleSubmit((data) => settingsMutation.mutate(data))}
              className="bg-white rounded-2xl border border-gray-100 p-6"
            >
              <h2 className="font-bold text-gray-800 mb-6">
                Configuración general
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre de la tienda"
                  defaultValue={settings?.tienda_nombre}
                  {...register("tienda_nombre")}
                />
                <Input
                  label="Símbolo de moneda"
                  defaultValue={settings?.tienda_simbolo}
                  {...register("tienda_simbolo")}
                />
                <Input
                  label="Moneda (código)"
                  defaultValue={settings?.tienda_moneda}
                  {...register("tienda_moneda")}
                />
                <Input
                  label="Mínimo para envío gratis (S/)"
                  type="number"
                  defaultValue={settings?.envio_gratis_desde}
                  {...register("envio_gratis_desde")}
                />
                <Input
                  label="IGV / IVA (%)"
                  type="number"
                  defaultValue={settings?.iva_porcentaje}
                  {...register("iva_porcentaje")}
                />
                <Input
                  label="Máximo items en carrito"
                  type="number"
                  defaultValue={settings?.max_items_carrito}
                  {...register("max_items_carrito")}
                />
              </div>
              <div className="flex justify-end mt-6">
                <Button type="submit" loading={settingsMutation.isPending}>
                  <Save size={16} /> Guardar cambios
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      )}

      {/* Envíos */}
      {activeTab === "envios" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-4"
        >
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditShipping(null);
                setShippingModal(true);
              }}
            >
              <Plus size={16} /> Nuevo método
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loadingShipping ? (
              <Spinner />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">
                      Método
                    </th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">
                      Precio
                    </th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">
                      Días entrega
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
                  {shipping?.map((method) => (
                    <tr
                      key={method.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition"
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">
                          {method.nombre}
                        </p>
                        {method.descripcion && (
                          <p className="text-xs text-gray-400">
                            {method.descripcion}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-red-500">
                        {method.precio == 0
                          ? "Gratis"
                          : formatPrice(method.precio)}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {method.dias_entrega_min}–{method.dias_entrega_max} días
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${method.activo
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                            }`}
                        >
                          {method.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              setEditShipping(method);
                              setShippingModal(true);
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit size={15} className="text-blue-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <ShippingModal
            isOpen={shippingModal}
            onClose={() => setShippingModal(false)}
            method={editShipping}
          />
        </motion.div>
      )}
    </div>
  );
}

function ShippingModal({ isOpen, onClose, method }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: method || {},
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        method || {
          nombre: "",
          descripcion: "",
          precio: "",
          dias_entrega_min: "",
          dias_entrega_max: "",
          activo: 1,
        },
      );
    }
  }, [isOpen, method, reset]);

  const mutation = useMutation({
    mutationFn: (data) =>
      method
        ? adminAPI.updateShipping(method.id, {
          ...data,
          precio: Number(data.precio),
          dias_entrega_min: Number(data.dias_entrega_min),
          dias_entrega_max: Number(data.dias_entrega_max),
        })
        : adminAPI.createShipping({
          ...data,
          precio: Number(data.precio),
          dias_entrega_min: Number(data.dias_entrega_min),
          dias_entrega_max: Number(data.dias_entrega_max),
        }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shipping"] });
      toast.success(method ? "Método actualizado" : "Método creado");
      reset();
      onClose();
    },
    onError: (err) => toast.error(err.message || "Error al guardar"),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={method ? "Editar método de envío" : "Nuevo método de envío"}
    >
      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="flex flex-col gap-4"
      >
        <Input
          label="Nombre"
          placeholder="Ej: Envío Express"
          {...register("nombre", { required: true })}
        />
        <Input
          label="Descripción"
          placeholder="Ej: Entrega en 2-3 días"
          {...register("descripcion")}
        />
        <Input
          label="Precio (S/)"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("precio", { required: true })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Días mínimo"
            type="number"
            placeholder="1"
            {...register("dias_entrega_min", { required: true })}
          />
          <Input
            label="Días máximo"
            type="number"
            placeholder="7"
            {...register("dias_entrega_max", { required: true })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-400"
            {...register("activo")}
          >
            <option value={1}>Activo</option>
            <option value={0}>Inactivo</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {method ? "Guardar" : "Crear"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
