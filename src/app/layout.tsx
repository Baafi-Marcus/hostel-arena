import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hostel FC Arena — FC 26 Hostel League",
  description: "Live tournaments, results, standings and all-time rankings for the hostel's FC 26 players.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anton&family=Barlow:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
