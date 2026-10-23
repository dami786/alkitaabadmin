export default function Logo({ light = false }) {
  return (
    <span className="flex items-center gap-3">
      <span className={`grid h-10 w-10 place-items-center rounded-full ring-1 ${light ? "bg-white/10 ring-gold/50" : "bg-pine text-white ring-gold/40"}`}>
        <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
          <path d="M6 22c4-8 16-8 20 0" fill="none" stroke="#E4B15C" strokeWidth="2" />
          <path d="M8 14c3 4 13 4 16 0v8H8v-8z" fill="#FBF6F1" />
        </svg>
      </span>
      <span>
        <span className={`block text-xs font-extrabold leading-tight sm:text-sm ${light ? "text-white" : "text-pine"}`}>Al-Kitab Seerat Quiz</span>
        <span className="block text-[11px] font-semibold text-gold">Academy office</span>
      </span>
    </span>
  );
}
