// frontend/components/Navbar.tsx

// We need "use client" because we are going to use NextAuth hooks to check the user's state.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// useSession grabs the current user, signIn opens the login modal, signOut logs them out
import { useSession, signIn, signOut } from "next-auth/react";

export default function Navbar() {
  // data: session extracts the user data. status tells us if it's loading, authenticated, or unauthenticated.
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/studio", label: "Studio" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <nav className="app-container flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          Rhythm<span className="ui-gradient">AI</span>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                isActive(link.href)
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
        {status === "loading" ? (
          <div className="h-8 w-20 bg-neutral-800 animate-pulse rounded-full"></div>
        ) : session ? (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-neutral-400 sm:block">
              {session.user?.name || "Musician"}
            </span>
            <button 
              onClick={() => signOut()}
              className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button 
            onClick={() => signIn(undefined, { callbackUrl: "/studio" })}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200 transition-colors"
          >
            Sign In
          </button>
        )}
        </div>
      </nav>
    </header>
  );
}