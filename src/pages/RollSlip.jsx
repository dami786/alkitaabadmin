import { useEffect, useRef, useState } from "react";
import { adminRequest } from "../api";

export default function RollSlip({ id, onBack, onUnauthorized }) {
  const [slip, setSlip] = useState(null);
  const [error, setError] = useState("");
  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  useEffect(() => {
    let active = true;
    adminRequest(`/api/admin/registrations/${id}/roll-slip`)
      .then((data) => {
        if (active) setSlip(data);
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
  }, [id]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <button className="btn-outline !px-4 !py-2" type="button" onClick={onBack}>
          Back
        </button>
        <button className="btn-gold !px-4 !py-2" type="button" onClick={() => window.print()} disabled={!slip}>
          Print / Save PDF
        </button>
      </div>

      {error && (
        <p className="no-print rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
          {error}
        </p>
      )}
      {!slip && !error && <p className="no-print text-sm text-muted">Opening the roll number slip…</p>}

      {slip && (
        <article className="print-card rounded-3xl border-4 border-gold bg-white p-6 md:p-10">
          <div className="border-b border-gold/40 pb-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-goldDeep">Al-Kitab Online Quran Academy</p>
            <h2 className="mt-2 text-2xl font-extrabold text-pine">{slip.competition}</h2>
            <p className="mt-1 text-sm font-semibold text-muted">Admit Card / Roll Number Slip</p>
          </div>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row">
            {slip.photo && <img src={slip.photo} alt="" className="h-40 w-32 rounded-xl object-cover ring-1 ring-[#eadfd8]" />}
            <dl className="grid flex-1 gap-3 text-sm sm:grid-cols-2">
              <Item label="Name" value={slip.name} />
              <Item label="Father's name" value={slip.fatherName} />
              <Item label="Registration number" value={slip.regNumber} />
              <Item label="Roll number" value={slip.rollNumber} />
              <Item label="City" value={`${slip.city}, ${slip.province}`} />
              <Item label="Gender" value={slip.gender} />
              <Item label="Date" value={slip.date || "To be announced"} />
              <Item label="Time" value={slip.time || "To be announced"} />
              <Item label="Venue" value={slip.centerConfirmed ? slip.venue : slip.venueMessage} wide />
            </dl>
          </div>
          <div className="mt-6 rounded-2xl bg-cream p-4">
            <h3 className="font-extrabold text-pine">Instructions</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
              {(slip.instructions || []).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <button type="button" className="btn-primary no-print mt-6" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </article>
      )}
    </main>
  );
}

function Item({ label, value, wide }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="font-bold text-ink">{value || "—"}</dd>
    </div>
  );
}
