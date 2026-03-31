"use client";

import { useState } from "react";
import Link from "next/link";
// import { signIn } from "next-auth/react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Send the data to the API route we just built
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      if (response.ok) {
        // If successful, send them to the login page
        window.location.href = '/login'; 
      } else {
        // If the email is taken, show the error from our backend
        const data = await response.json();
        alert(data.error); 
      }
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="app-container">
      <div className="mx-auto max-w-md glass-panel px-6 py-8 sm:px-10 sm:py-10">
        <h2 className="ui-title text-center text-3xl">
          Create your account
        </h2>
        <p className="ui-muted mt-2 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-cyan-300 hover:text-cyan-200 transition-colors">
            Sign in here
          </Link>
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-neutral-300">Name</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-md border border-slate-600/80 bg-slate-950/80 px-3 py-2 text-white placeholder-neutral-500 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Parichaye Grover"
                />
              </div>
            </div>

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
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-50"
            >
              {isLoading ? "Creating account..." : "Sign up"}
            </button>
          </form>
      </div>
    </main>
  );
}