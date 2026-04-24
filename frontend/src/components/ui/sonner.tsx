"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: "#1c1c1e",
          color: "#f5f5f5",
          border: "1px solid #3a3a3c",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
