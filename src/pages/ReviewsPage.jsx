import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, Trash2, Star } from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI } from "../api/admin.api.js";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { formatDateShort } from "../utils/formatDate.js";

export default function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("pendientes");
  const queryClient = useQueryClient();

  const { data: result, isLoading } = useQuery({
    queryKey: ["admin-reviews", page, filter],
    queryFn: () => adminAPI.getReviews({ page, limit: 15 }),
    select: (res) => res,
  });

  const reviews = (result?.data || []).filter((r) =>
    filter === "pendientes" ? !r.aprobado : r.aprobado,
  );

  const approveMutation = useMutation({
    mutationFn: adminAPI.approveReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Reseña aprobada");
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Reseñas</h1>
          <p className="text-sm text-gray-500">
            Modera las reseñas de productos
          </p>
        </div>
        <div className="flex gap-2">
          {["pendientes", "aprobadas"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? "bg-red-500 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <Spinner />
        ) : reviews.length === 0 ? (
          <div className="text-center py-16">
            <Star size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No hay reseñas {filter}</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-5 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-500 font-bold text-sm">
                        {review.autor?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">
                          {review.autor}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDateShort(review.created_at)}
                        </p>
                      </div>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={
                              i < review.calificacion
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-200"
                            }
                          />
                        ))}
                      </div>
                      <Badge variant={review.aprobado ? "green" : "yellow"}>
                        {review.aprobado ? "Aprobada" : "Pendiente"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">
                      Producto:{" "}
                      <span className="text-gray-600 font-medium">
                        {review.producto}
                      </span>
                    </p>
                    {review.titulo && (
                      <p className="text-sm font-medium text-gray-800">
                        {review.titulo}
                      </p>
                    )}
                    {review.comentario && (
                      <p className="text-sm text-gray-600 mt-1">
                        {review.comentario}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!review.aprobado && (
                      <button
                        onClick={() => approveMutation.mutate(review.id)}
                        className="p-1.5 hover:bg-green-50 rounded-lg transition"
                        title="Aprobar"
                      >
                        <Check size={16} className="text-green-500" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
