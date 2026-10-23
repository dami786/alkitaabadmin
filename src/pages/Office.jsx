import { useCallback, useEffect, useRef, useState } from "react";
import { adminRequest, downloadExport, getUsername } from "../api";
import Badge from "../components/Badge";
import CandidateDrawer from "../components/CandidateDrawer";
import Logo from "../components/Logo";
import Cities from "./Cities";
import RollSlip from "./RollSlip";
import { formatDob, identityNumber, identityType, paymentLabel, text } from "../format";

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "rejected", label: "Rejected" },
];

const emptyCounts = { all: 0, pending: 0, accepted: 0, rejected: 0 };

export default function Office({ onLogout }) {
  const [overview, setOverview] = useState(null);
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [counts, setCounts] = useState(emptyCounts);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedKey, setLoadedKey] = useState("");
  const loadTicket = useRef(0);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailLoaded, setDetailLoaded] = useState(false);
  const [screen, setScreen] = useState("registrations");
  const [slipId, setSlipId] = useState("");
  const openTicket = useRef(0);

  const requestKey = `${tab}|${appliedQuery}`;

  const load = useCallback(async ({ silent = false } = {}) => {
    const ticket = ++loadTicket.current;
    const key = `${tab}|${appliedQuery}`;
    if (!silent) {
      setLoading(true);
      setError("");
    }
    const params = new URLSearchParams({ status: tab, q: appliedQuery });
    try {
      const [stats, list] = await Promise.all([
        adminRequest("/api/admin/overview"),
        adminRequest(`/api/admin/registrations?${params}`),
      ]);
      if (loadTicket.current !== ticket) return;
      setOverview(stats);
      setCounts(list.counts || emptyCounts);
      setRows(list.registrations || []);
      setLoadedKey(key);
      setError("");
    } catch (err) {
      if (loadTicket.current !== ticket) return;
      if (err.unauthorized) {
        onLogout("Your session ended. Please sign in again.");
        return;
      }
      if (!silent) {
        setError(err.message);
        setLoadedKey(key);
      }
    } finally {
      if (loadTicket.current === ticket) setLoading(false);
    }
  }, [tab, appliedQuery, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") load({ silent: true });
    };
    const timer = setInterval(refresh, 3000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => setAppliedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function openCandidate(row) {
    const ticket = ++openTicket.current;
    setSelected(row);
    setDetailLoaded(false);
    try {
      const full = await adminRequest(`/api/admin/registrations/${row.id}`);
      if (openTicket.current !== ticket) return;
      setSelected(full);
      setDetailLoaded(true);
    } catch (err) {
      if (openTicket.current !== ticket) return;
      if (err.unauthorized) {
        onLogout("Your session ended. Please sign in again.");
        return;
      }
      setError(err.message);
    }
  }

  function closeCandidate() {
    openTicket.current += 1;
    setSelected(null);
    setDetailLoaded(false);
  }

  async function removeSelected() {
    closeCandidate();
    await load({ silent: true });
  }

  async function refreshSelected() {
    const id = selected?.id;
    const ticket = openTicket.current;
    await load({ silent: true });
    if (!id || openTicket.current !== ticket) return;
    try {
      const full = await adminRequest(`/api/admin/registrations/${id}`);
      if (openTicket.current !== ticket) return;
      setSelected((current) => (current?.id === id ? full : current));
      setDetailLoaded(true);
    } catch (err) {
      if (err.unauthorized) onLogout("Your session ended. Please sign in again.");
    }
  }

  async function exportExcel() {
    setExporting(true);
    setError("");
    try {
      await downloadExport();
    } catch (err) {
      if (err.unauthorized) {
        onLogout("Your session ended. Please sign in again.");
        return;
      }
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }

  const tabCount = {
    pending: counts.pending,
    accepted: counts.accepted,
    rejected: counts.rejected,
  };
  const tabLabel = TABS.find((item) => item.id === tab)?.label || "Pending";
  const listReady = loadedKey === requestKey && !loading;

  return (
    <div className="pattern min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b-4 border-gold bg-pine text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logo light />
          <nav className="flex items-center gap-1" aria-label="Office">
            <button
              type="button"
              className={`rounded-full px-3 py-2 text-xs font-bold sm:text-sm ${screen === "registrations" ? "bg-white/15 text-gold" : "text-white/80 hover:text-gold"}`}
              onClick={() => setScreen("registrations")}
            >
              Registrations
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-2 text-xs font-bold sm:text-sm ${screen === "cities" ? "bg-white/15 text-gold" : "text-white/80 hover:text-gold"}`}
              onClick={() => {
                closeCandidate();
                setScreen("cities");
              }}
            >
              Cities
            </button>
          </nav>
          <div className="flex items-center gap-2">
            <button className="btn-gold !px-3 !py-2 !text-xs sm:!px-4 sm:!text-sm" type="button" onClick={exportExcel} disabled={exporting}>
              {exporting ? "Preparing…" : "Download Excel"}
            </button>
            <button className="btn-outline !border-white/30 !bg-transparent !px-3 !py-2 !text-xs !text-white hover:!bg-white/10 sm:!px-4 sm:!text-sm" type="button" onClick={() => onLogout("")}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {screen === "slip" ? (
        <RollSlip
          id={slipId}
          onBack={() => setScreen("registrations")}
          onUnauthorized={() => onLogout("Your session ended. Please sign in again.")}
        />
      ) : screen === "cities" ? (
        <Cities onUnauthorized={() => onLogout("Your session ended. Please sign in again.")} />
      ) : (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-goldDeep">Rahmat-e-Kainat 2026–27</p>
            <h1 className="mt-1 text-3xl font-extrabold text-pine">Registrations</h1>
            <p className="mt-1 text-sm text-muted">Signed in as {getUsername()}</p>
          </div>
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total" value={overview?.total ?? counts.all} />
          <Stat label="Pending" value={overview?.pending ?? counts.pending} />
          <Stat label="Accepted" value={overview?.approved ?? counts.accepted} />
          <Stat label="Rejected" value={overview?.rejected ?? counts.rejected} />
        </section>

        <section className="card mt-6 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Registration status">
              {TABS.map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      active ? "bg-pine text-white" : "bg-cream text-pine hover:bg-pine/10"
                    }`}
                    onClick={() => setTab(item.id)}
                  >
                    {item.label}
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/15 text-gold" : "bg-white text-goldDeep"}`}>
                      {tabCount[item.id] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                setAppliedQuery(query.trim());
              }}
            >
              <label className="sr-only" htmlFor="search">
                Search registrations
              </label>
              <input
                id="search"
                className="field sm:w-80"
                placeholder="Name, father, mobile, email, city, reg no, roll no, CNIC, transaction"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </form>
          </div>

          {error && (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
              {error}
            </p>
          )}

          <p className="mt-4 text-sm text-muted">
            {!listReady
              ? "Loading registrations…"
              : appliedQuery
                ? `${rows.length} match${rows.length === 1 ? "" : "es"} in ${tabLabel}`
                : `${rows.length} ${tabLabel.toLowerCase()} registration${rows.length === 1 ? "" : "s"}`}
          </p>

          {listReady && rows.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[#eadfd8] bg-cream px-4 py-12 text-center">
              <p className="font-semibold text-pine">No {tabLabel.toLowerCase()} registrations</p>
              <p className="mt-1 text-sm text-muted">
                {appliedQuery ? "Try another name, number, or city." : "New applications will appear here."}
              </p>
            </div>
          ) : listReady ? (
            <>
              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Registration</th>
                      <th className="px-3 py-2 font-semibold">Candidate</th>
                      <th className="px-3 py-2 font-semibold">City</th>
                      <th className="px-3 py-2 font-semibold">Identity</th>
                      <th className="px-3 py-2 font-semibold">Payment</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className="cursor-pointer border-t border-[#eadfd8] transition hover:bg-cream"
                        onClick={() => openCandidate(row)}
                      >
                        <td className="px-3 py-3">
                          <p className="font-bold text-pine">{row.regNumber}</p>
                          <p className="text-xs text-muted">{row.rollNumber || "No roll number"}</p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-semibold">{row.fullName}</p>
                          <p className="text-xs text-muted">{row.fatherName}</p>
                          <p className="text-xs text-muted">{row.mobile}</p>
                        </td>
                        <td className="px-3 py-3">
                          <p>{text(row.city)}</p>
                          <p className="text-xs text-muted">{row.province}</p>
                        </td>
                        <td className="px-3 py-3">
                          <p>{text(identityNumber(row))}</p>
                          <p className="text-xs text-muted">{identityType(row)}</p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium">{paymentLabel(row.paymentMethod)}</p>
                          <p className="text-xs text-muted">{row.transactionId}</p>
                        </td>
                        <td className="px-3 py-3">
                          <Badge value={row.status} />
                          <p className="mt-1 text-xs text-muted">
                            {row.hasPhoto ? "Photo" : "No photo"} · {row.hasReceipt ? "Receipt" : "No receipt"}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3 md:hidden">
                {rows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className="w-full rounded-2xl border border-[#eadfd8] bg-cream p-4 text-left"
                    onClick={() => openCandidate(row)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-pine">{row.regNumber}</p>
                        <p className="text-base font-semibold">{row.fullName}</p>
                        <p className="text-sm text-muted">{row.fatherName}</p>
                      </div>
                      <Badge value={row.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {row.city} · {formatDob(row.dob)} · {identityNumber(row)}
                    </p>
                    <p className="mt-2 text-xs text-muted">{paymentLabel(row.paymentMethod)}</p>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </section>
      </main>
      )}

      {screen === "registrations" && selected && (
        <CandidateDrawer
          key={selected.id}
          candidate={selected}
          imagesReady={detailLoaded}
          onClose={closeCandidate}
          onChanged={refreshSelected}
          onDeleted={removeSelected}
          onOpenSlip={(id) => {
            setSlipId(id);
            setScreen("slip");
          }}
          onUnauthorized={() => onLogout("Your session ended. Please sign in again.")}
        />
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#eadfd8] bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-pine">{value ?? "—"}</p>
    </div>
  );
}
