import { useEffect, useRef, useState } from "react";
import { adminRequest } from "../api";

export default function Cities({ onUnauthorized }) {
  const [centers, setCenters] = useState(null);
  const [error, setError] = useState("");
  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  useEffect(() => {
    let active = true;
    adminRequest("/api/admin/content")
      .then((settings) => {
        if (active) setCenters(settings.centers || []);
      })
      .catch((err) => {
        if (!active) return;
        if (err.unauthorized) {
          onUnauthorizedRef.current();
          return;
        }
        setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const groups = [];
  for (const center of centers || []) {
    const last = groups[groups.length - 1];
    if (!last || last.province !== center.province) groups.push({ province: center.province, cities: [center] });
    else last.cities.push(center);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-goldDeep">Rahmat-e-Kainat 2026–27</p>
      <h1 className="mt-1 text-3xl font-extrabold text-pine">Test centers</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        No city has a confirmed center until you save one. The choice here is copied onto every candidate who selected that city. Leave the center unconfirmed to print only the city name.
      </p>
      {error && (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
          {error}
        </p>
      )}
      {!centers && !error && <p className="mt-6 text-sm text-muted">Loading cities…</p>}
      <div className="mt-6 space-y-8">
        {groups.map((group) => (
          <section key={group.province}>
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-pine">{group.province}</h2>
            <div className="gold-line my-3" />
            <div className="grid gap-4 lg:grid-cols-2">
              {group.cities.map((center) => (
                <CityCard
                  key={`${center.province}-${center.city}`}
                  center={center}
                  onUnauthorized={onUnauthorized}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function CityCard({ center, onUnauthorized }) {
  const [pending, setPending] = useState(center.confirmed !== true);
  const [venue, setVenue] = useState(center.venue || "");
  const [examDate, setExamDate] = useState(center.examDate || "");
  const [examTime, setExamTime] = useState(center.examTime || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function save(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!pending && venue.trim().length < 8) {
      setError("Enter the confirmed center address, or leave the center as not confirmed.");
      return;
    }
    setBusy(true);
    try {
      const saved = await adminRequest("/api/admin/roll-slip-city", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          province: center.province,
          city: center.city,
          examDate,
          examTime,
          centerConfirmed: !pending,
          examVenue: pending ? "" : venue.trim(),
        }),
      });
      setPending(saved.centerConfirmed !== true);
      setVenue(saved.examVenue || "");
      setExamDate(saved.examDate || "");
      setExamTime(saved.examTime || "");
      const count = saved.updated ?? 0;
      setMessage(
        saved.centerConfirmed
          ? `Center confirmed for ${center.city}. ${count} candidate record${count === 1 ? "" : "s"} updated.`
          : `Center left unconfirmed for ${center.city}. ${count} candidate record${count === 1 ? "" : "s"} updated.`
      );
    } catch (err) {
      if (err.unauthorized) {
        onUnauthorized();
        return;
      }
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card p-5" onSubmit={save}>
      <h3 className="text-lg font-extrabold text-pine">{center.city}</h3>
      <p className="text-sm text-muted">{center.province}</p>
      <label className="mt-4 flex items-start gap-2 text-sm font-semibold text-ink">
        <input type="checkbox" className="mt-1" checked={pending} onChange={(event) => setPending(event.target.checked)} />
        Center not confirmed yet
      </label>
      {pending ? (
        <p className="mt-3 rounded-2xl bg-cream px-4 py-3 text-sm text-muted">
          Slips for this city keep the city name only. The exact address is added when the center is confirmed.
        </p>
      ) : (
        <label className="mt-3 block">
          <span className="label">Center address</span>
          <textarea
            className="field min-h-24"
            value={venue}
            onChange={(event) => setVenue(event.target.value)}
            placeholder="Govt. College Hall, Mall Road, Lahore"
            required
          />
        </label>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Exam date</span>
          <input className="field" value={examDate} onChange={(event) => setExamDate(event.target.value)} placeholder="15 March 2027" />
        </label>
        <label className="block">
          <span className="label">Exam time</span>
          <input className="field" value={examTime} onChange={(event) => setExamTime(event.target.value)} placeholder="10:00 AM" />
        </label>
      </div>
      {error && (
        <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
          {message}
        </p>
      )}
      <button className="btn-primary mt-4 !px-4 !py-2" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Apply to every candidate in this city"}
      </button>
    </form>
  );
}
