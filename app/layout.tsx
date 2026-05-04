import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wafers, Please!",
  description: "Desktop-first WebVR semiconductor inspection prototype"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        {/*
          WebXR DOM overlay root lives on document.body so immersive compositors
          can attach it reliably. Game UI is portaled here from the home page.
        */}
        <div id="vr-dom-ui-root" className="vr-dom-ui-root vr-dom-ui-root--body" aria-hidden="true" suppressHydrationWarning />
      </body>
    </html>
  );
}
