import { useState } from "react";
import { request, saveSession } from "../api";
import Logo from "../components/Logo";

export default function Login({ onSuccess, notice }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await request("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      saveSession(data.token, data.username);
      onSuccess(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pattern flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card overflow-hidden">
          <div className="border-b-4 border-gold bg-pine px-6 py-6">
            <Logo light />
            <p className="urdu mt-4 text-lg text-gold">رحمت کائنات کوئز مقابلہ</p>
            <p className="mt-1 text-sm text-white/80">Sign in to review registrations, fees, and results.</p>
          </div>
          <form onSubmit={submit} className="space-y-4 px-6 py-6">
            {notice && (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" role="status">
                {notice}
              </p>
            )}
            {error && (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
                {error}
              </p>
            )}
            <label className="block">
              <span className="label">Username</span>
              <input
                className="field"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="label">Password</span>
              <input
                className="field"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button className="btn-primary w-full" type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
