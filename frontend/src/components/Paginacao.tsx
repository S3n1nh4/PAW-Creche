import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginacaoProps {
  pagina: number;
  totalPaginas: number;
  onMudar: (pagina: number) => void;
}

// Ex.: 1 | 2 | 3 | ... | 99
function paginasVisiveis(pagina: number, total: number): (number | '...')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const numeros = [...new Set([1, total, pagina - 1, pagina, pagina + 1])]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const saida: (number | '...')[] = [];
  numeros.forEach((n, i) => {
    if (i > 0 && n - numeros[i - 1] > 1) saida.push('...');
    saida.push(n);
  });
  return saida;
}

export default function Paginacao({ pagina, totalPaginas, onMudar }: PaginacaoProps) {
  return (
    <nav
      aria-label="Paginação"
      className="inline-flex items-center gap-2 bg-pp-700 text-white rounded-md px-3 py-1.5 text-[12px]"
    >
      <button
        type="button"
        onClick={() => onMudar(pagina - 1)}
        disabled={pagina <= 1}
        aria-label="Página anterior"
        className="disabled:opacity-40 cursor-pointer"
      >
        <FiChevronLeft size={14} />
      </button>
      {paginasVisiveis(pagina, totalPaginas).map((p, i) =>
        p === '...' ? (
          <span key={`reticencias-${i}`}>...</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onMudar(p)}
            aria-current={p === pagina ? 'page' : undefined}
            className={`min-w-5 cursor-pointer ${p === pagina ? 'font-bold underline' : ''}`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onMudar(pagina + 1)}
        disabled={pagina >= totalPaginas}
        aria-label="Próxima página"
        className="disabled:opacity-40 cursor-pointer"
      >
        <FiChevronRight size={14} />
      </button>
    </nav>
  );
}