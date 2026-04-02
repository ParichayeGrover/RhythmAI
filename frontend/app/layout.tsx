// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Sora, Space_Grotesk } from "next/font/google";
import "./globals.css";

// 1. Import the new wrapper we just created
import AuthProvider from "./components/AuthProvider";
import Navbar from "./components/Navbar";

const sora = Sora({ subsets: ["latin"], variable: "--font-heading" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "RhythmAI",
  description: "An Intelligent Creative Partner for Musicians",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${sora.variable} bg-transparent text-slate-50 antialiased`}>
        {/* 2. We wrap the {children} with our AuthProvider. 
          Now, every page in your app can ask "Is the user logged in?" 
          without crashing the Next.js server.
        */}
        <AuthProvider>
          <Navbar />
          <div className="pt-28 pb-10 md:pt-32 fade-up">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}