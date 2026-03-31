"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react"; // <-- This is NextAuth's hidden 'fetch' API

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // This executes the hidden fetch request to your NextAuth authorize function!
    const result = await signIn("credentials", {
      email: email,
      password: password,
      redirect: false, // We set this to false so we can show an alert if they type the wrong password
    });

    if (result?.error) {
      alert(result.error); // E.g., "Invalid password" or "No user found"
      setIsLoading(false);
    } else {
      // Success! NextAuth just planted the JWT cookie. Route them to the Studio.
      window.location.href = '/studio';
    }
  };

  return (
    <main className="app-container">
      <div className="mx-auto max-w-md glass-panel px-6 py-8 sm:px-10 sm:py-10">
        <h2 className="ui-title text-center text-3xl">
          Sign in to Rhythm<span className="ui-gradient">AI</span>
        </h2>
        <p className="ui-muted mt-2 text-center text-sm">
          Or{" "}
          <Link href="/signup" className="font-medium text-cyan-300 hover:text-cyan-200 transition-colors">
            create a new account
          </Link>
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-neutral-300">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border border-slate-600/80 bg-slate-950/80 px-3 py-2 text-white placeholder-neutral-500 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="parichaye@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-slate-600/80 bg-slate-950/80 px-3 py-2 text-white placeholder-neutral-500 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
      </div>
    </main>
  );
}