import type { Metadata } from "next";
import "./globals.css";
import ReactQueryProvider from "./providers/ReactQueryProvider";
import ReactReduxProviders from "./providers/ReactReduxProvider";
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
        <ReactReduxProviders>
          <ReactQueryProvider>
            {children}
            <Toaster position="top-right" />
          </ReactQueryProvider>
        </ReactReduxProviders>
      </body>
    </html>
  );
}
