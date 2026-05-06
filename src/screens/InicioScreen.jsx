import { useEffect, useState } from 'react';
import { getStats, getSelecciones } from '../api';
import TEAM_COLORS from '../data/teamColors';

const DonutChart = ({ collected, total }) => {
  const pct  = total === 0 ? 0 : collected / total;
  const r    = 54;
  const circ = 2 * Math.PI * r;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#E5E7EB" strokeWidth="16" />
      <circle
        cx="70" cy="70" r={r} fill="none"
        stroke="#2563EB" strokeWidth="16"
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="bold" fill="currentColor" className="text-gray-900 dark:text-gray-100">
        {Math.round(pct * 100)}%
      </text>
      <text x="70" y="84" textAnchor="middle" fontSize="11" fill="#6B7280">
        completado
      </text>
    </svg>
  );
};

const StatItem = ({ label, value, color }) => (
  <div className="flex items-baseline gap-1.5">
    <span className={`text-2xl font-bold ${color}`}>{value}</span>
    <span className="text-xs text-gray-500">{label}</span>
  </div>
);

const InicioScreen = () => {
  const [stats,       setStats]       = useState(null);
  const [selecciones, setSelecciones] = useState([]);

  useEffect(() => {
    Promise.all([getStats(), getSelecciones()]).then(([s, sels]) => {
      setStats(s);
      setSelecciones(sels);
    });
  }, []);

  if (!stats) {
    return <div className="flex items-center justify-center h-full text-gray-400">Cargando...</div>;
  }

  // Lookup de seleccion por abreviatura
  const selMap = Object.fromEntries(selecciones.map(s => [s.abreviatura, s]));

  // Enriquecer byCountry con grupo y colores, luego agrupar
  const grouped = {};
  for (const c of stats.byCountry) {
    const sel    = selMap[c.country_abrv];
    const grupo  = !sel ? 'Otro'
                 : !sel.grupo ? sel.abreviatura
                 : `Grupo ${sel.grupo}`;
    const colors = TEAM_COLORS[c.country_abrv] ?? ['#2563EB', '#ffffff', '#1E40AF'];
    if (!grouped[grupo]) grouped[grupo] = [];
    grouped[grupo].push({ ...c, nombre: sel?.nombre ?? c.country_abrv, colors });
  }

  const grupos = Object.keys(grouped).sort((a, b) => {
    if (a === 'FWC') return -1;
    if (b === 'FWC') return  1;
    return a.localeCompare(b);
  });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Mi Colección</h1>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
        <DonutChart collected={stats.collected} total={stats.total} />
        <div className="space-y-2">
          <StatItem label="Coleccionadas" value={stats.collected}  color="text-blue-600"  />
          <StatItem label="Faltantes"     value={stats.missing}    color="text-red-500"   />
          <StatItem label="Repetidas"     value={stats.duplicates} color="text-amber-500" />
          <StatItem label="Total álbum"   value={stats.total}      color="text-gray-400"  />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-5">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Por selección</h2>
        {grupos.map(grupo => (
          <div key={grupo} className="space-y-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{grupo}</p>
            <div className="space-y-2">
              {grouped[grupo].map(c => {
                const pct  = Math.round((c.collected / c.total) * 100);
                const color = c.colors[0];
                return (
                  <div key={c.country_abrv} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-200">{c.nombre}</span>
                      <span className="text-gray-400">{c.collected}/{c.total}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InicioScreen;
