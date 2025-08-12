import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "react-hot-toast";
import DynamicAIChatButton from "@/components/ai/DynamicAIChatButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevLink - Developer Social Platform",
  description:
    "Connect with developers, showcase your projects, and collaborate on the next big thing.",
  keywords: [
    "developer",
    "social platform",
    "projects",
    "collaboration",
    "coding",
  ],
  authors: [{ name: "DevLink Team" }],
  robots: "index, follow",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "DevLink - Developer Social Platform",
    description:
      "Connect with developers, showcase your projects, and collaborate on the next big thing.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevLink - Developer Social Platform",
    description:
      "Connect with developers, showcase your projects, and collaborate on the next big thing.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <DynamicAIChatButton />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "14px",
                padding: "12px 16px",
                maxWidth: "400px",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
                style: {
                  background: "#065f46",
                  color: "#fff",
                  border: "1px solid #10b981",
                },
              },
              error: {
                duration: 6000,
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
                style: {
                  background: "#7f1d1d",
                  color: "#fff",
                  border: "1px solid #ef4444",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
