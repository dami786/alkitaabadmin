import { useEffect, useRef, useState } from "react";
import { adminRequest } from "../api";

export default function Messages({ onUnauthorized }) {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  useEffect(() => {
    let active = true;
    adminRequest("/api/admin/messages")
      .then((data) => {
        if (active) setMessages(data.messages || []);
      })
      .catch((err) => {
        if (!active) return;
        if (err.unauthorized) {
          onUnauthorizedRef.current();
          return;
        }
        setError(err.message);
        setMessages([]);
      });
    return () => {
      active = false;
    };
  }, []);

  async function markRead(item) {
    if (item.read || busyId) return;
    setBusyId(item.id);
    setError("");
    try {
      await adminRequest(`/api/admin/messages/${item.id}/read`, { method: "PATCH" });
      setMessages((current) => current.map((message) => (message.id === item.id ? { ...message, read: true } : message)));
    } catch (err) {
      if (err.unauthorized) {
        onUnauthorizedRef.current();
        return;
      }
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-goldDeep">Rahmat-e-Kainat 2026–27</p>
      <h1 className="mt-1 text-3xl font-extrabold text-pine">Messages</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">Messages sent from the public contact form.</p>

      {error && (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
          {error}
        </p>
      )}

      {messages === null && !error ? <p className="mt-6 text-sm text-muted">Loading messages…</p> : null}

      {messages?.length === 0 ? <p className="mt-6 text-sm text-muted">No messages yet.</p> : null}

      <div className="mt-6 space-y-3">
        {(messages || []).map((item) => (
          <article key={item.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-extrabold text-pine">{item.name}</h2>
              {!item.read && <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-pine">New</span>}
            </div>
            <p className="text-sm text-muted">
              {item.mobile || "No mobile"} · {item.email || "No email"}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{item.message}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</span>
              {!item.read && (
                <button type="button" className="font-bold text-pine" disabled={busyId === item.id} onClick={() => markRead(item)}>
                  {busyId === item.id ? "Saving…" : "Mark as read"}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
