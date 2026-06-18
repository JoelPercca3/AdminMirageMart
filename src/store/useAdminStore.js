import { create } from "zustand";

const useAdminStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("adminUser") || "null"),
  token: localStorage.getItem("adminToken") || null,

  setAuth: (user, token) => {
    localStorage.setItem("adminToken", token);
    localStorage.setItem("adminUser", JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    set({ user: null, token: null });
  },
}));

export default useAdminStore;
