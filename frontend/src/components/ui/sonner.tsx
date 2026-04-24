"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "#1c1c1e",
          "--normal-text": "#f5f5f5",
          "--normal-border": "#3a3a3c",
          "--error-bg": "#2a1a1a",
          "--error-text": "#f5f5f5",
          "--success-bg": "#1a2a1a",
          "--success-text": "#f5f5f5",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
