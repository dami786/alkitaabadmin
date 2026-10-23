import { badgeClass, paymentStatusLabel, statusLabel } from "../format";

export default function Badge({ value, kind = "status" }) {
  const label = kind === "payment" ? paymentStatusLabel(value) : statusLabel(value);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badgeClass(value)}`}>
      {label}
    </span>
  );
}
