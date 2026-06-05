export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-6 sm:mt-8 flex-wrap">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed text-xs sm:text-sm px-2 sm:px-3"
      >
        Prec.
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="btn-ghost text-xs sm:text-sm px-2 sm:px-3">1</button>
          {start > 2 && <span className="text-neutral-500 px-0.5 sm:px-1 text-xs">...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm transition ${
            p === page
              ? 'bg-brand text-white font-semibold'
              : 'btn-ghost'
          }`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-neutral-500 px-0.5 sm:px-1 text-xs">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="btn-ghost text-xs sm:text-sm px-2 sm:px-3">{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed text-xs sm:text-sm px-2 sm:px-3"
      >
        Suiv.
      </button>
    </div>
  );
}
