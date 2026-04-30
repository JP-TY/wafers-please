import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wafers, Please!",
  description: "Desktop-first WebVR semiconductor inspection prototype"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
