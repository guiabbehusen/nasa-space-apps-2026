import type { Metadata } from "next";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/lora/400.css";
import "@fontsource/lora/500.css";
import "@fontsource/lora/400-italic.css";
import "@fontsource/caveat/600.css";
import "@fontsource/caveat/400.css";
import "@fontsource/kalam/400.css";
import "./globals.css";
import "./objects.css";

export const metadata: Metadata = {
  title: "Still Here — A little closer, from anywhere",
  description:
    "A quiet place for shared stories. Keep making memories together, even when a reply takes a little longer.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
