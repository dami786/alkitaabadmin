import { useEffect, useRef, useState } from "react";
import { adminRequest } from "../api";
import Badge from "./Badge";
import {
  formatDob,
  formatWhen,
  identityNumber,
  identityType,
  isPdf,
  paymentLabel,
  statusLabel,
  text,
} from "../format";

export default function CandidateDrawer({ candidate, imagesReady, onClose, onChanged, onDeleted, onUnauthorized, onOpenSlip }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const decisionSnapshot = useRef(null);
  const [showReject, setShowReject] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [note, setNote] = useState(candidate.adminNote || "");
  const [examDate, setExamDate] = useState(candidate.examDate || "");
  const [examTime, setExamTime] = useState(candidate.examTime || "");
  const [centerPending, setCenterPending] = useState(candidate.centerConfirmed !== true);
  const [examVenue, setExamVenue] = useState(candidate.examVenue || "");
  const [marks, setMarks] = useState(candidate.result?.marks || "");
  const [position, setPosition] = useState(candidate.result?.position || "");
  const [remarks, setRemarks] = useState(candidate.result?.remarks || "");
  const [published, setPublished] = useState(Boolean(candidate.result?.published));
  const [zoom, setZoom] = useState(null);

  useEffect(() => {
    setExamDate(candidate.examDate || "");
    setExamTime(candidate.examTime || "");
    setCenterPending(candidate.centerConfirmed !== true);
    setExamVenue(candidate.examVenue || "");
  }, [candidate.examDate, candidate.examTime, candidate.centerConfirmed, candidate.examVenue]);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") {
        if (zoom) setZoom(null);
        else onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, zoom]);

  async function run(name, work, success) {
    setBusy(name);
    setError("");
    if (name !== "approve" && name !== "reject") setMessage("");
    try {
      const result = await work();
      setMessage(typeof success === "function" ? success(result) : success);
      if (name === "approve" || name === "reject") decisionSnapshot.current = null;
      onChanged(result);
      setBusy("");
    } catch (err) {
      if ((name === "approve" || name === "reject") && decisionSnapshot.current) {
        onChanged(decisionSnapshot.current);
        decisionSnapshot.current = null;
      }
      if (err.unauthorized) {
        onUnauthorized();
        return;
      }
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  function act(action, extra = {}, success) {
    if (action === "approve" || action === "reject") {
      decisionSnapshot.current = {
        status: candidate.status,
        adminNote: candidate.adminNote || "",
        rollNumber: candidate.rollNumber || "",
      };
      onChanged({
        status: action === "approve" ? "approved" : "rejected",
        adminNote: action === "reject" ? extra.note || "" : candidate.adminNote || "",
        rollNumber: candidate.rollNumber || "",
      });
      setShowReject(false);
      setShowDelete(false);
      setMessage(action === "approve" ? "Accepted." : "Rejected.");
    }
    return run(
      action,
      () =>
        adminRequest(`/api/admin/registrations/${candidate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...extra }),
        }),
      success
    );
  }

  const locked = Boolean(busy);
  const documentNo = identityNumber(candidate);
  const documentType = identityType(candidate);

  return (
    <div className="fixed inset-0 z-40">
      <button className="absolute inset-0 bg-pineDark/40" type="button" aria-label="Close candidate details" onClick={onClose} />
      <aside
        className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-cream shadow-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-title"
      >
        <header className="border-b-4 border-gold bg-pine px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{candidate.regNumber}</p>
              <h2 id="candidate-title" className="mt-1 text-2xl font-extrabold">
                {candidate.fullName}
              </h2>
              <p className="text-sm text-white/80">{candidate.fatherName}</p>
            </div>
            <button className="btn-outline !border-white/30 !bg-transparent !px-4 !py-2 !text-white hover:!bg-white/10" type="button" onClick={onClose}>
              Close
            </button>
          </div>
          {candidate.rollNumber ? (
            <p className="mt-4 rounded-2xl bg-gold px-4 py-3 text-sm font-extrabold text-pineDark">
              Roll number {candidate.rollNumber}
            </p>
          ) : (
            <p className="mt-4 text-sm text-white/75">Roll number is issued when this registration is accepted.</p>
          )}
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {error && (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
              {message}
            </p>
          )}

          <section className="grid gap-4 sm:grid-cols-2">
            <figure className="rounded-2xl border border-[#eadfd8] bg-white p-3">
              <figcaption className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Passport photo</figcaption>
              <Photo
                src={imagesReady ? candidate.photo : ""}
                waiting={!imagesReady}
                empty="No photograph on file."
                alt={`${candidate.fullName} passport photo`}
                onZoom={setZoom}
              />
            </figure>
            <figure className="rounded-2xl border border-[#eadfd8] bg-white p-3">
              <figcaption className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Payment receipt</figcaption>
              <Receipt
                src={imagesReady ? candidate.receipt : ""}
                waiting={!imagesReady}
                regNumber={candidate.regNumber}
                onZoom={setZoom}
              />
            </figure>
          </section>

          <section className="rounded-2xl border border-[#eadfd8] bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge value={candidate.status} />
            </div>
            <p className="mt-3 text-sm text-muted">
              Accept issues the roll number. A rejected registration can be accepted again, and an accepted one can still be rejected. The same roll number is kept.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(candidate.status === "pending" || candidate.status === "rejected") && (
                <button
                  className="btn-gold !px-4 !py-2"
                  type="button"
                  disabled={locked}
                  onClick={() =>
                    act("approve", {}, "Accepted.")
                  }
                >
                  Accept
                </button>
              )}
              {(candidate.status === "pending" || candidate.status === "approved") && (
                <button
                  className="btn-danger !px-4 !py-2"
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    setShowDelete(false);
                    setShowReject((open) => !open);
                  }}
                >
                  Reject
                </button>
              )}
              <button
                className="btn-outline !px-4 !py-2"
                type="button"
                disabled={locked}
                onClick={() => {
                  setShowReject(false);
                  setShowDelete((open) => !open);
                }}
              >
                Delete
              </button>
            </div>
            {showReject && (
              <form
                className="mt-4 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  act("reject", { note: note.trim() }, "Rejected.");
                }}
              >
                <label className="block">
                  <span className="label">Rejection note</span>
                  <textarea
                    className="field min-h-24"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="This note is shown to the candidate"
                    required
                  />
                </label>
                <button className="btn-danger !px-4 !py-2" type="submit" disabled={locked}>
                  {busy === "reject" ? "Rejecting…" : "Confirm reject"}
                </button>
              </form>
            )}
            {showDelete && (
              <form
                className="mt-4 space-y-3 rounded-2xl bg-rose-50 p-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setBusy("delete");
                  setError("");
                  setMessage("");
                  try {
                    await adminRequest(`/api/admin/registrations/${candidate.id}`, { method: "DELETE" });
                    onDeleted();
                  } catch (err) {
                    if (err.unauthorized) {
                      onUnauthorized();
                      return;
                    }
                    setError(err.message);
                  } finally {
                    setBusy("");
                  }
                }}
              >
                <p className="text-sm font-semibold text-rose-800">
                  Delete {candidate.fullName} ({candidate.regNumber})? The passport photo and payment receipt are removed. This CNIC, mobile, and email can be used to register again.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-danger !px-4 !py-2" type="submit" disabled={locked}>
                    {busy === "delete" ? "Deleting…" : "Delete this registration"}
                  </button>
                  <button className="btn-outline !px-4 !py-2" type="button" disabled={locked} onClick={() => setShowDelete(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>

          {candidate.adminNote && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <span className="font-bold">Rejection note. </span>
              {candidate.adminNote}
            </p>
          )}

          <section>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-pine">Candidate</h3>
            <div className="gold-line my-3" />
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Registration number">{candidate.regNumber}</Field>
              <Field label="Roll number">{candidate.rollNumber}</Field>
              <Field label="Name">{candidate.fullName}</Field>
              <Field label="Father name">{candidate.fatherName}</Field>
              <Field label="Date of birth">{formatDob(candidate.dob)}</Field>
              <Field label="Age">{candidate.age ? `${candidate.age} years` : ""}</Field>
              <Field label="Gender">{candidate.gender}</Field>
              <Field label="CNIC / B-Form">{documentNo}</Field>
              <Field label="Document type">{documentType}</Field>
              <Field label="Province">{candidate.province}</Field>
              <Field label="City">{candidate.city}</Field>
              <Field label="Address" wide>
                {candidate.address}
              </Field>
              <Field label="Mobile">{candidate.mobile}</Field>
              <Field label="Email">{candidate.email}</Field>
              <Field label="Payment method">{paymentLabel(candidate.paymentMethod)}</Field>
              <Field label="Transaction ID">{candidate.transactionId}</Field>
              <Field label="Application status">{statusLabel(candidate.status)}</Field>
              <Field label="Submitted">{formatWhen(candidate.createdAt)}</Field>
            </dl>
          </section>

          <section className="rounded-2xl border border-[#eadfd8] bg-white p-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-pine">Roll number slip</h3>
            {candidate.status !== "approved" ? (
              <p className="mt-2 text-sm text-muted">Accept this registration to issue a roll number and set the slip. The slip prints the city, and the center address only after it is confirmed.</p>
            ) : (
              <form
                className="mt-4 grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const venue = examVenue.trim();
                  const confirmed = !centerPending || venue.length >= 8;
                  if (confirmed && venue.length < 8) {
                    setError("Enter the full center address (at least 8 characters), or tick “Center not confirmed yet”.");
                    setMessage("");
                    return;
                  }
                  act(
                    "roll-slip",
                    {
                      examDate,
                      examTime,
                      centerConfirmed: confirmed,
                      examVenue: confirmed ? venue : "",
                    },
                    (updated) => {
                      setExamDate(updated.examDate || "");
                      setExamTime(updated.examTime || "");
                      setCenterPending(updated.centerConfirmed !== true);
                      setExamVenue(updated.examVenue || "");
                      const when = `${updated.examDate || "To be announced"} at ${updated.examTime || "To be announced"}`;
                      return updated.centerConfirmed
                        ? `Slip saved. ${when}. Center: ${updated.examVenue}.`
                        : `Slip saved. ${when}. Tick off “Center not confirmed yet” and enter the address to print the center.`;
                    }
                  );
                }}
              >
                <p className="text-sm text-muted">
                  Date and time can stay empty. The slip then says “To be announced”. CNIC, mobile, email, and home address are not printed.
                </p>
                <label className="block">
                  <span className="label">Exam date</span>
                  <input className="field" value={examDate} onChange={(event) => setExamDate(event.target.value)} placeholder="15 March 2027" />
                </label>
                <label className="block">
                  <span className="label">Exam time</span>
                  <input className="field" value={examTime} onChange={(event) => setExamTime(event.target.value)} placeholder="10:00 AM" />
                </label>
                <label className="flex items-start gap-2 text-sm font-semibold text-ink">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={centerPending}
                    onChange={(event) => setCenterPending(event.target.checked)}
                  />
                  Center not confirmed yet
                </label>
                <label className="block">
                  <span className="label">Center address</span>
                  <textarea
                    className="field min-h-24"
                    value={examVenue}
                    onChange={(event) => {
                      const next = event.target.value;
                      setExamVenue(next);
                      if (next.trim().length >= 8) setCenterPending(false);
                    }}
                    placeholder="Govt. College Hall, Mall Road, Lahore"
                  />
                </label>
                {centerPending ? (
                  <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-muted">
                    The slip prints the city until a center address is saved. Type the full address and it will be printed on the admit card.
                  </p>
                ) : null}
                {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
                <div className="flex flex-wrap gap-2">
                  <button className="btn-primary !px-4 !py-2" type="submit" disabled={locked}>
                    {busy === "roll-slip" ? "Saving…" : "Save slip"}
                  </button>
                  <button
                    className="btn-outline !px-4 !py-2"
                    type="button"
                    disabled={!candidate.rollNumber}
                    onClick={() => onOpenSlip(candidate.id)}
                  >
                    Open slip
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-[#eadfd8] bg-white p-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-pine">Result</h3>
            <p className="mt-1 text-sm text-muted">Published results can be opened with the registration number on the public site.</p>
            <form
              className="mt-4 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                run(
                  "result",
                  () =>
                    adminRequest(`/api/admin/registrations/${candidate.id}/result`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ marks, position, remarks, published }),
                    }),
                  published ? "Result saved and published." : "Result saved. It is not published yet."
                );
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Marks</span>
                  <input className="field" value={marks} onChange={(event) => setMarks(event.target.value)} placeholder="92" />
                </label>
                <label className="block">
                  <span className="label">Position</span>
                  <input className="field" value={position} onChange={(event) => setPosition(event.target.value)} placeholder="1st" />
                </label>
              </div>
              <label className="block">
                <span className="label">Remarks</span>
                <input className="field" value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Excellent" />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />
                Publish this result
              </label>
              <div>
                <button className="btn-gold !px-4 !py-2" type="submit" disabled={locked}>
                  {busy === "result" ? "Saving…" : "Save result"}
                </button>
              </div>
            </form>
            {candidate.result?.marks && (
              <p className="mt-3 text-sm text-muted">
                Saved: {text(candidate.result.marks)} marks
                {candidate.result.position ? `, ${candidate.result.position}` : ""}
                {candidate.result.published ? " · published" : " · not published"}
              </p>
            )}
          </section>
        </div>
      </aside>

      {zoom && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-pineDark/80 p-6" onClick={() => setZoom(null)} role="presentation">
          <img src={zoom.src} alt={zoom.alt} className="max-h-[90vh] max-w-full rounded-xl bg-white object-contain" />
        </div>
      )}
    </div>
  );
}

function Field({ label, children, wide = false }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-ink">{text(children)}</dd>
    </div>
  );
}

function Photo({ src, waiting, empty, alt, onZoom }) {
  if (waiting) return <p className="py-16 text-center text-sm text-muted">Loading photograph…</p>;
  if (!src) return <p className="py-16 text-center text-sm text-muted">{empty}</p>;
  return (
    <button type="button" className="block w-full" onClick={() => onZoom({ src, alt })}>
      <img src={src} alt={alt} className="mx-auto max-h-72 max-w-full rounded-xl object-contain" />
    </button>
  );
}

function Receipt({ src, waiting, regNumber, onZoom }) {
  if (waiting) return <p className="py-16 text-center text-sm text-muted">Loading receipt…</p>;
  if (!src) return <p className="py-16 text-center text-sm text-muted">No receipt on file.</p>;
  if (isPdf(src)) {
    return (
      <a className="btn-outline !px-4 !py-2" href={src} download={`${regNumber || "payment"}-receipt.pdf`}>
        Download receipt (PDF)
      </a>
    );
  }
  return (
    <button type="button" className="block w-full" onClick={() => onZoom({ src, alt: "Payment receipt" })}>
      <img src={src} alt="Payment receipt" className="mx-auto max-h-80 max-w-full rounded-xl object-contain" />
    </button>
  );
}
