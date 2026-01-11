import type { Metadata } from "next";
import "./globals.scss";
import ToastProvider from "./components/Toast/ToastProvider";

export const metadata: Metadata = {
  title: "Business Hirurgiy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
