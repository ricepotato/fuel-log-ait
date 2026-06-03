import { Toast } from "@toss/tds-mobile";
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface ToastOptions {
  text: string;
  position?: "top" | "bottom";
  leftAddon?: ReactNode;
  duration?: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ToastOptions | null>(null);

  const show = (opts: ToastOptions) => {
    setOptions(opts);
    setOpen(true);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {options && (
        <Toast
          position={options.position ?? "bottom"}
          open={open}
          text={options.text}
          leftAddon={options.leftAddon}
          duration={options.duration ?? 3000}
          onClose={() => setOpen(false)}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
