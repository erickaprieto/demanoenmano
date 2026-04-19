"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No autorizado.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-white">Admin Panel</h1>
      <p className="mt-2 text-sm text-zinc-500">Acceso restringido al administrador.</p>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        {error ? <p className="text-xs text-red-300">{error}</p> : null}
        <input
          type="email"
          placeholder="admin@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
          required
        />
        <input
          type="password"
          placeholder="Contraseña admin"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-violet-electric py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar al panel"}
        </button>
      </form>
    </div>
  );
}
