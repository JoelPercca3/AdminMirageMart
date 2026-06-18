export const formatPrice = (amount) => {
  if (amount === null || amount === undefined) return "S/ 0.00";
  return `S/ ${Number(amount).toFixed(2)}`;
};
