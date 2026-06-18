import { forwardRef } from "react";
import { cn } from "../../utils/cn.js";

const Input = forwardRef(({ label, error, className, ...props }, ref) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
    )}
    <input
      ref={ref}
      className={cn(
        "w-full px-3 py-2 rounded-lg border text-sm outline-none transition",
        "border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100",
        error && "border-red-400",
        className,
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));
Input.displayName = "Input";
export default Input;
