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

  if (!stats || !stats.byCountry) {
    return <div className="flex items-center justify-center h-full text-gray-400">Cargando...</div>;
  }

  const FWC_COLORS = ['#B8860B', '#FFD700', '#DAA520'];

  // Lookup de seleccion por abreviatura
  const selMap = Object.fromEntries(selecciones.map(s => [s.abreviatura, s]));

  // Enriquecer byCountry con grupo y colores, luego agrupar respetando el orden de selecciones
  const byCountryMap = Object.fromEntries(stats.byCountry.map(c => [c.country_abrv, c]));
  const grouped = {};

  // FWC parte 1 (00–08) al inicio
  const fwcA = byCountryMap['FWC_A'];
  if (fwcA) grouped['FWC_inicio'] = [{ ...fwcA, nombre: '00 al 08', colors: FWC_COLORS }];

  // Grupos A–L en el orden correcto del álbum
  for (const sel of selecciones) {
    if (sel.abreviatura === 'FWC') continue;
    const c = byCountryMap[sel.abreviatura];
    if (!c) continue;
    const grupo  = !sel.grupo ? sel.abreviatura : `Grupo ${sel.grupo}`;
    const colors = TEAM_COLORS[sel.abreviatura] ?? ['#2563EB', '#ffffff', '#1E40AF'];
    if (!grouped[grupo]) grouped[grupo] = [];
    grouped[grupo].push({ ...c, nombre: sel.nombre, colors });
  }

  // FWC parte 2 (09–19) al final
  const fwcB = byCountryMap['FWC_B'];
  if (fwcB) grouped['FWC_final'] = [{ ...fwcB, nombre: '09 al 19', colors: FWC_COLORS }];

  // Entradas sin selección conocida
  for (const c of stats.byCountry) {
    if (!selMap[c.country_abrv] && c.country_abrv !== 'FWC_A' && c.country_abrv !== 'FWC_B') {
      const colors = TEAM_COLORS[c.country_abrv] ?? ['#2563EB', '#ffffff', '#1E40AF'];
      if (!grouped['Otro']) grouped['Otro'] = [];
      grouped['Otro'].push({ ...c, nombre: c.country_abrv, colors });
    }
  }

  const grupoPriority = (g) => {
    if (g === 'FWC_inicio') return 0;
    if (g === 'FWC_final')  return 2;
    if (g === 'Otro')       return 3;
    return 1;
  };
  const grupoLabel = (g) => {
    if (g === 'FWC_inicio' || g === 'FWC_final') return 'Estampas FWC';
    return g;
  };
  const grupos = Object.keys(grouped).sort((a, b) => {
    const pa = grupoPriority(a), pb = grupoPriority(b);
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  });

  const allEntries = Object.values(grouped).flat().filter(c => c.total > 0);
  const byPct = (c) => c.collected / c.total;
  const top3    = [...allEntries].sort((a, b) => byPct(b) - byPct(a)).slice(0, 3);
  const bottom3 = [...allEntries].sort((a, b) => byPct(a) - byPct(b)).slice(0, 3);

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

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Rankings</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Más completas</p>
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Menos completas</p>
          {[0, 1, 2].map(i => (
            <>
              {[top3[i], bottom3[i]].map((c, j) => c ? (
                <div key={`${i}-${j}`} className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-bold text-gray-300 w-3 flex-shrink-0">{i + 1}</span>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.colors[0] }} />
                  <span className="text-xs text-gray-700 dark:text-gray-200 flex-1 truncate">{c.nombre}</span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{c.collected}/{c.total}</span>
                </div>
              ) : <div key={`${i}-${j}`} />)}
            </>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-5">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Por selección</h2>
        {grupos.map(grupo => (
          <div key={grupo} className="space-y-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{grupoLabel(grupo)}</p>
            <div className="space-y-2">
              {grouped[grupo].map(c => {
                const pct    = Math.round((c.collected / c.total) * 100);
                const dupPct = Math.min(Math.round(((c.duplicates ?? 0) / c.total) * 100), 100);
                const color  = c.colors[0];
                return (
                  <div key={c.country_abrv} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-200">{c.nombre}</span>
                      <span className="text-gray-400">{c.collected}/{c.total}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    {(c.duplicates ?? 0) > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${dupPct}%`, backgroundColor: color, opacity: 0.75 }} />
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{c.duplicates} repetidas</span>
                      </div>
                    )}
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
