export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Prec.
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="btn-ghost">1</button>
          {start > 2 && <span className="text-neutral-500 px-1">...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1.5 rounded-lg text-sm transition ${
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
          {end < totalPages - 1 && <span className="text-neutral-500 px-1">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="btn-ghost">{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Suiv.
      </button>
    </div>
  );
}
