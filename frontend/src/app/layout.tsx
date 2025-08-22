import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "./providers/queryClient";

export const metadata: Metadata = {
  title: "Flick",
  description: "A messaging app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
