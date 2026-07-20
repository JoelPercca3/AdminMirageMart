import api from "./axios.js";

export const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `http://localhost:4000${url}`;
};

export const adminAPI = {
  // Dashboard
  dashboard: () => api.get("/admin/dashboard"),
  salesStats: () => api.get("/admin/stats/sales"),
  productStats: () => api.get("/admin/stats/products"),
  userStats: () => api.get("/admin/stats/users"),
  revenueStats: () => api.get("/admin/stats/revenue"),

  // Productos
  getProducts: (params) => api.get("/products", { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post("/products", data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  changeStatus: (id, estado) => api.patch(`/products/${id}/status`, { estado }),

  // Órdenes
  getOrders: (params) => api.get("/admin/orders", { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateStatus: (id, estado, comentario) =>
    api.patch(`/admin/orders/${id}/status`, { estado, comentario }),
  updateTracking: (id, tracking_number, courier, clave_recojo) =>
    api.patch(`/admin/orders/${id}/tracking`, {
      tracking_number,
      courier,
      clave_recojo,
    }),
  refundOrder: (charge_id, order_id, amount, reason) =>
    api.post("/payments/refund", { charge_id, order_id, amount, reason }),
  // Usuarios
  getUsers: (params) => api.get("/admin/users", { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  changeUserStatus: (id, activo) =>
    api.patch(`/admin/users/${id}/status`, { activo }),

  sendPromo: (data) => api.post("/admin/promos/send", data),

  // Categorías
  getCategories: () => api.get("/admin/categories"),
  createCategory: (data) => api.post("/admin/categories", data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // Cupones
  getCoupons: () => api.get("/admin/coupons"),
  createCoupon: (data) => api.post("/admin/coupons", data),
  updateCoupon: (id, data) => api.put(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),

  // Banners
  getAllBanners: () => api.get("/banners/admin/all"),
  createBanner: (data) => api.post("/banners/admin", data),
  updateBanner: (id, data) => api.put(`/banners/admin/${id}`, data),
  deleteBanner: (id) => api.delete(`/banners/admin/${id}`),

  // Settings
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (data) => api.put("/admin/settings", data),

  // Shipping
  getShipping: () => api.get("/admin/shipping"),
  createShipping: (data) => api.post("/admin/shipping", data),
  updateShipping: (id, data) => api.put(`/admin/shipping/${id}`, data),

  // Reviews
  getReviews: (params) => api.get("/admin/reviews", { params }),
  approveReview: (id) => api.patch(`/admin/reviews/${id}/approve`),

  // Mensajes de contacto
  getContactMessages: (params) =>
    api.get("/admin/contact-messages", { params }),
  markContactMessageRead: (id, leido) =>
    api.patch(`/admin/contact-messages/${id}/read`, { leido }),

  // Libro de reclamaciones
  getLibroReclamaciones: (params) =>
    api.get("/admin/libro-reclamaciones", { params }),
  getLibroReclamacionItem: (id) => api.get(`/admin/libro-reclamaciones/${id}`),
  responderLibroReclamacion: (id, respuesta) =>
    api.patch(`/admin/libro-reclamaciones/${id}/responder`, { respuesta }),

  // Newsletter
  getNewsletterSubscribers: (params) =>
    api.get("/admin/newsletter-subscribers", { params }),
  setNewsletterSubscriberStatus: (id, activo) =>
    api.patch(`/admin/newsletter-subscribers/${id}/status`, { activo }),

  // Marcas
  getBrands: () => api.get("/admin/brands"),
  createBrand: (nombre) => api.post("/admin/brands", { nombre }),

  // Upload — rutas separadas por contexto
  uploadImage: (
    formData, // ← productos (admin)
  ) =>
    api.post("/uploads/product", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  uploadBannerImage: (
    formData, // ← banners (admin)
  ) =>
    api.post("/uploads/banner", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  uploadCategoryImage: (
    formData, // ← categorías (admin)
  ) =>
    api.post("/uploads/category", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Imágenes de variantes
  uploadVariantImage: (variantId, formData) =>
    api.post(`/admin/variants/${variantId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteVariantImage: (imageId) =>
    api.delete(`/admin/variants/images/${imageId}`),
  setVariantImageAsPrimary: (imageId) =>
    api.put(`/admin/variants/images/${imageId}/primary`),
  getVariantImages: (variantId) =>
    api.get(`/admin/variants/${variantId}/images`),

  getRefundRequests: (params) => api.get("/refund-requests", { params }),
  approveRefundRequest: (id) => api.patch(`/refund-requests/${id}/approve`),
  rejectRefundRequest: (id, respuesta_admin) =>
    api.patch(`/refund-requests/${id}/reject`, { respuesta_admin }),

  getReturnRequests: (params) => api.get("/return-requests", { params }),
  approveReturnRequest: (id, instrucciones_admin) =>
    api.patch(`/return-requests/${id}/approve`, { instrucciones_admin }),
  rejectReturnRequest: (id, respuesta_admin) =>
    api.patch(`/return-requests/${id}/reject`, { respuesta_admin }),
  markReturnReceived: (id) => api.patch(`/return-requests/${id}/received`),
  confirmReturnRefund: (id) =>
    api.patch(`/return-requests/${id}/confirm-refund`),

  // ─── Atributos ──────────────────────────────────────────────────────────────
  getAttributes: () => api.get("/attributes"),
  createAttribute: (data) => api.post("/attributes", data),
  updateAttribute: (id, data) => api.put(`/attributes/${id}`, data),
  deleteAttribute: (id) => api.delete(`/attributes/${id}`),

  getCategoryAttributes: (categoryId) =>
    api.get(`/attributes/categories/${categoryId}/attributes`),
  assignAttributeToCategory: (categoryId, data) =>
    api.post(`/attributes/categories/${categoryId}/attributes`, data),
  removeAttributeFromCategory: (categoryId, attributeId) =>
    api.delete(
      `/attributes/categories/${categoryId}/attributes/${attributeId}`,
    ),
};
