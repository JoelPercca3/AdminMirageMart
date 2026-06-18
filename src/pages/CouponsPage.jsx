import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { adminAPI } from "../api/admin.api.js";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import Input from "../components/ui/Input.jsx";
import Badge from "../components/ui/Badge.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { formatPrice } from "../utils/formatPrice.js";
import { formatDateShort } from "../utils/formatDate.js";

export default function CouponsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const queryClient = useQueryClient();

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: adminAPI.getCoupons,
    select: (res) => res.data,
  });

  const deleteMutation = useMutation({
    mutationFn: adminAPI.deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Cupón eliminado");
    },
    onError: (err) => toast.error(err.message || "Error al eliminar"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Cupones</h1>
          <p className="text-sm text-gray-500">
            {coupons?.length || 0} cupones
          </p>
        </div>
        <Button
          onClick={() => {
            setEditCoupon(null);
            setShowModal(true);
          }}
        >
          <Plus size={16} /> Nuevo cupón
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <Spinner />
        ) : coupons?.length === 0 ? (
          <div className="text-center py-16">
            <Tag size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No hay cupones</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Código
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Tipo
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Valor
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Uso
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Vence
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
                {coupons?.map((coupon) => (
                  <motion.tr
                    key={coupon.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                        {coupon.codigo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 capitalize">
                      {coupon.tipo_descuento.replace("_", " ")}
                    </td>
                    <td className="py-3 px-4 font-bold text-red-500">
                      {coupon.tipo_descuento === "porcentaje"
                        ? `${coupon.valor}%`
                        : formatPrice(coupon.valor)}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {coupon.uso_actual} / {coupon.uso_maximo || "∞"}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {coupon.expires_at
                        ? formatDateShort(coupon.expires_at)
                        : "Sin vencimiento"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={coupon.activo ? "green" : "gray"}>
                        {coupon.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditCoupon(coupon);
                            setShowModal(true);
                          }}
                          className="p-1.5 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit size={15} className="text-blue-500" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("¿Eliminar este cupón?"))
                              deleteMutation.mutate(coupon.id);
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
          </div>
        )}
      </div>

      <CouponModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        coupon={editCoupon}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
          setShowModal(false);
        }}
      />
    </div>
  );
}

function CouponModal({ isOpen, onClose, coupon, onSuccess }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: coupon || {},
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      coupon
        ? adminAPI.updateCoupon(coupon.id, data)
        : adminAPI.createCoupon(data),
    onSuccess: () => {
      toast.success(coupon ? "Cupón actualizado" : "Cupón creado");
      reset();
      onSuccess();
    },
    onError: (err) => toast.error(err.message || "Error al guardar"),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={coupon ? "Editar cupón" : "Nuevo cupón"}
    >
      <form
        onSubmit={handleSubmit((data) =>
          mutation.mutate({
            ...data,
            valor: Number(data.valor),
            minimo_compra: Number(data.minimo_compra || 0),
          }),
        )}
        className="flex flex-col gap-4"
      >
        <Input
          label="Código"
          placeholder="Ej: VERANO20"
          {...register("codigo", { required: true })}
        />
        <Input
          label="Descripción"
          placeholder="Ej: 20% de descuento en verano"
          {...register("descripcion")}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de descuento
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-400"
            {...register("tipo_descuento", { required: true })}
          >
            <option value="porcentaje">Porcentaje (%)</option>
            <option value="monto_fijo">Monto fijo (S/)</option>
            <option value="envio_gratis">Envío gratis</option>
          </select>
        </div>
        <Input
          label="Valor"
          type="number"
          step="0.01"
          placeholder="0"
          {...register("valor", { required: true })}
        />
        <Input
          label="Mínimo de compra (S/)"
          type="number"
          step="0.01"
          placeholder="0"
          {...register("minimo_compra")}
        />
        <Input
          label="Uso máximo (vacío = ilimitado)"
          type="number"
          placeholder="∞"
          {...register("uso_maximo")}
        />
        <Input
          label="Fecha de vencimiento (opcional)"
          type="datetime-local"
          {...register("expires_at")}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {coupon ? "Guardar" : "Crear"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
