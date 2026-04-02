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

  const linkClass = (href: string) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition ui-focus ${
      isActive(href)
        ? "bg-white text-slate-950"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <nav className="app-container py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-lg font-semibold tracking-tight text-white ui-focus rounded-md px-2 py-1">
            Rhythm<span className="ui-gradient">AI</span>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <div className="h-9 w-24 animate-pulse rounded-full bg-white/10"></div>
            ) : session ? (
              <div className="flex items-center gap-3">
                <span className="hidden max-w-36 truncate text-sm text-slate-300 sm:block">
                  {session.user?.name || "Musician"}
                </span>
                <button
                  onClick={() => signOut()}
                  className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10 ui-focus"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn(undefined, { callbackUrl: "/studio" })}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200 ui-focus"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1 md:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
          {!session && status !== "loading" && (
            <Link href="/login" className="rounded-full px-4 py-1.5 text-sm font-medium text-cyan-200 hover:bg-cyan-400/10 ui-focus">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}