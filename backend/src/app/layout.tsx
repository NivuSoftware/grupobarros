import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GrupoBarros API",
  description: "Backend API para GrupoBarros",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
