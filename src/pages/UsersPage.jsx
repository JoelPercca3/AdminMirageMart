// UsersPage.jsx - Versión limpia y funcional
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, UserCheck, UserX, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI } from "../api/admin.api.js";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { formatDateShort } from "../utils/formatDate.js";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [rol, setRol] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const {
    data: result,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-users", page, search, rol],
    queryFn: () => adminAPI.getUsers({ page, limit: 15, search, rol }),
  });

  // Extraer datos - ahora tu API devuelve la estructura correcta
  const users = result?.data || [];
  const meta = result?.meta || { page: 1, totalPages: 1, total: 0, limit: 15 };

  const statusMutation = useMutation({
    mutationFn: ({ id, activo }) => adminAPI.changeUserStatus(id, activo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Estado de usuario actualizado");
    },
    onError: (err) => toast.error(err.message || "Error al actualizar"),
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Error al cargar usuarios
          </h3>
          <p className="text-gray-500 mb-4">{error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw size={16} className="mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-sm text-gray-500">
            {meta.total || 0} usuarios registrados
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          loading={isFetching}
        >
          <RefreshCw size={14} className="mr-1" />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400"
          />
        </div>
        <select
          value={rol}
          onChange={(e) => {
            setRol(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400"
        >
          <option value="">Todos los roles</option>
          <option value="cliente">Cliente</option>
          <option value="admin">Admin</option>
          <option value="vendedor">Vendedor</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="py-16">
            <Spinner />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Usuario
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Rol
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Teléfono
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    Registro
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
                {users.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-500 font-bold text-sm flex-shrink-0">
                          {user.nombre?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {user.nombre}
                          </p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          user.rol === "admin"
                            ? "red"
                            : user.rol === "vendedor"
                              ? "purple"
                              : "gray"
                        }
                      >
                        {user.rol}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {user.telefono || "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {formatDateShort(user.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.activo ? "green" : "red"}>
                        {user.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() =>
                            statusMutation.mutate({
                              id: user.id,
                              activo: !user.activo,
                            })
                          }
                          className={`p-1.5 rounded-lg transition ${
                            user.activo
                              ? "hover:bg-red-50 text-red-500"
                              : "hover:bg-green-50 text-green-500"
                          }`}
                          title={user.activo ? "Desactivar" : "Activar"}
                        >
                          {user.activo ? (
                            <UserX size={16} />
                          ) : (
                            <UserCheck size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
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
    </div>
  );
}
