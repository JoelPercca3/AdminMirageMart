import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { authAPI } from "../api/auth.api.js";
import useAdminStore from "../store/useAdminStore.js";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export default function LoginPage() {
  const { setAuth } = useAdminStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (res) => {
      if (res.data.user.rol !== "admin") {
        toast.error("No tienes permisos de administrador");
        return;
      }
      setAuth(res.data.user, res.data.accessToken);
      toast.success("¡Bienvenido al panel admin!");
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message || "Credenciales incorrectas"),
  });

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Mirage<span className="text-red-400">Mart</span> Admin
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Panel de administración</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <form
            onSubmit={handleSubmit((data) => mutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <Input
              label="Email"
              type="email"
              placeholder="admin@miragemart.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="Tu contraseña"
              error={errors.password?.message}
              {...register("password")}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              loading={mutation.isPending}
            >
              Ingresar al panel
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
