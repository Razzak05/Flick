import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "./providers/queryClient";
import ReduxProviders from "./providers/reduxProvider";
import { Toaster } from "react-hot-toast";

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
        <ReduxProviders>
          <QueryProvider>
            {children}
            <Toaster position="top-right" />
          </QueryProvider>
        </ReduxProviders>
      </body>
    </html>
  );
}
