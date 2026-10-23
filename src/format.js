const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function text(value) {
  const cleaned = String(value ?? "").trim();
  return cleaned || "—";
}

export function formatDob(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ""));
  if (!match) return text(value);
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}

export function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function paymentLabel(value) {
  if (value === "easypaisa") return "EasyPaisa";
  if (value === "bank") return "Bank transfer";
  return text(value);
}

export function statusLabel(value) {
  if (value === "approved" || value === "accepted") return "Accepted";
  if (value === "pending") return "Pending";
  if (value === "rejected") return "Rejected";
  return text(value);
}

export function paymentStatusLabel(value) {
  if (value === "unverified") return "Unverified";
  if (value === "verified") return "Verified";
  if (value === "rejected") return "Rejected";
  return text(value);
}

export function badgeClass(value) {
  if (value === "approved" || value === "accepted" || value === "verified") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }
  if (value === "rejected") return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-amber-50 text-amber-900 ring-amber-200";
}

export function identityNumber(candidate) {
  return candidate?.identityNumber || candidate?.cnic || candidate?.bform || "";
}

export function identityType(candidate) {
  if (candidate?.identityType) return candidate.identityType;
  if (candidate?.cnic) return "CNIC";
  if (candidate?.bform) return "B-Form";
  return "";
}

export function isPdf(dataUrl) {
  return String(dataUrl || "").startsWith("data:application/pdf");
}
