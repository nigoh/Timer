"use client";

import { useSyncExternalStore } from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const useColorMode = () =>
  useSyncExternalStore(
    (cb) => {
      const o = new MutationObserver(cb);
      o.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => o.disconnect();
    },
    () =>
      document.documentElement.classList.contains("dark")
        ? ("dark" as const)
        : ("light" as const),
    () => "light" as const,
  );

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useColorMode();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
