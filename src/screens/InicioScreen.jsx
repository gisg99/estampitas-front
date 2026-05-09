import { useEffect, useState } from 'react';
import { getStats, getSelecciones, getUser } from '../api';
import TEAM_COLORS from '../data/teamColors';

const FLAG = {
  FWC: '🏆', CC:  '🔴',
  MEX: '🇲🇽', RSA: '🇿🇦', KOR: '🇰🇷', CZE: '🇨🇿',
  CAN: '🇨🇦', BIH: '🇧🇦', QAT: '🇶🇦', SUI: '🇨🇭',
  BRA: '🇧🇷', MAR: '🇲🇦', HAI: '🇭🇹', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  USA: '🇺🇸', PAR: '🇵🇾', AUS: '🇦🇺', TUR: '🇹🇷',
  GER: '🇩🇪', CUW: '🇨🇼', CIV: '🇨🇮', ECU: '🇪🇨',
  NED: '🇳🇱', JPN: '🇯🇵', SWE: '🇸🇪', TUN: '🇹🇳',
  BEL: '🇧🇪', EGY: '🇪🇬', IRN: '🇮🇷', NZL: '🇳🇿',
  ESP: '🇪🇸', URU: '🇺🇾', KSA: '🇸🇦', CPV: '🇨🇻',
  FRA: '🇫🇷', SEN: '🇸🇳', IRQ: '🇮🇶', NOR: '🇳🇴',
  ARG: '🇦🇷', AUT: '🇦🇹', ALG: '🇩🇿', JOR: '🇯🇴',
  POR: '🇵🇹', COL: '🇨🇴', UZB: '🇺🇿', COD: '🇨🇩',
  ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', CRO: '🇭🇷', PAN: '🇵🇦', GHA: '🇬🇭',
};

const DonutChart = ({ collected, total }) => {
  const pct  = total === 0 ? 0 : collected / total;
  const r    = 54;
  const circ = 2 * Math.PI * r;

  return (
    <svg width="130" height="130" viewBox="0 0 140 140">
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

const InicioScreen = () => {
  const [stats,       setStats]       = useState(null);
  const [selecciones, setSelecciones] = useState([]);
  const [user,        setUser]        = useState(null);

  useEffect(() => {
    Promise.all([getStats(), getSelecciones(), getUser()]).then(([s, sels, u]) => {
      setStats(s);
      setSelecciones(sels);
      setUser(u);
    });
  }, []);

  if (!stats || !stats.byCountry) {
    return <div className="flex items-center justify-center h-full text-gray-400">Cargando...</div>;
  }

  const firstName = (user?.name ?? 'coleccionista').split(' ')[0];
  const overallPct = stats.total === 0 ? 0 : Math.round((stats.collected / stats.total) * 100);

  const welcomeMsg =
    overallPct >= 100 ? '¡Álbum completo, eres una leyenda! 🏆' :
    overallPct >= 75  ? `¡Ya casi! Solo te faltan ${stats.missing} estampas 😤` :
    overallPct >= 50  ? `¡Más de la mitad completado! Vas muy bien 🔥` :
    overallPct >= 25  ? `Tu colección va al ${overallPct}% — ¡buen ritmo! 🚀` :
                        `Tu colección va al ${overallPct}% — ¡cada estampa cuenta! 💪`;

  // Favorite team
  const favAbrv   = user?.seleccion_favorita_abrv;
  const favName   = user?.seleccion_favorita_nombre ?? favAbrv;
  const favData   = favAbrv ? stats.byCountry.find(c => c.country_abrv === favAbrv) : null;
  const favColors = favAbrv ? (TEAM_COLORS[favAbrv] ?? ['#2563EB']) : null;
  const favPct    = favData && favData.total > 0 ? Math.round((favData.collected / favData.total) * 100) : 0;
  const favMissing = favData ? favData.total - favData.collected : 0;

  const FWC_COLORS = ['#B8860B', '#FFD700', '#DAA520'];
  const selMap = Object.fromEntries(selecciones.map(s => [s.abreviatura, s]));

  const byCountryMap = Object.fromEntries(stats.byCountry.map(c => [c.country_abrv, c]));
  const grouped = {};

  const fwcA = byCountryMap['FWC_A'];
  if (fwcA) grouped['FWC_inicio'] = [{ ...fwcA, nombre: '00 al 08', colors: FWC_COLORS }];

  for (const sel of selecciones) {
    if (sel.abreviatura === 'FWC') continue;
    const c = byCountryMap[sel.abreviatura];
    if (!c) continue;
    const grupo  = !sel.grupo ? sel.abreviatura : `Grupo ${sel.grupo}`;
    const colors = TEAM_COLORS[sel.abreviatura] ?? ['#2563EB', '#ffffff', '#1E40AF'];
    if (!grouped[grupo]) grouped[grupo] = [];
    grouped[grupo].push({ ...c, nombre: sel.nombre, colors });
  }

  const fwcB = byCountryMap['FWC_B'];
  if (fwcB) grouped['FWC_final'] = [{ ...fwcB, nombre: '09 al 19', colors: FWC_COLORS }];

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
    <div className="p-4 space-y-4 pb-6">

      {/* ── Bienvenida ── */}
      <div className="pt-1 space-y-0.5">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Hola de nuevo, {firstName} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{welcomeMsg}</p>
      </div>

      {/* ── 4 tarjetas de estadísticas ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/50">
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.collected}</p>
          <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 mt-0.5">Coleccionadas</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-100 dark:border-red-800/50">
          <p className="text-3xl font-bold text-red-500 dark:text-red-400">{stats.missing}</p>
          <p className="text-xs font-semibold text-red-400 mt-0.5">Faltantes</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-800/50">
          <p className="text-3xl font-bold text-amber-500 dark:text-amber-400">{stats.duplicates}</p>
          <p className="text-xs font-semibold text-amber-500 dark:text-amber-400 mt-0.5">Repetidas</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-3xl font-bold text-gray-400">{stats.total}</p>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Total álbum</p>
        </div>
      </div>

      {/* ── Gráfica + leyenda (todos los números juntos) ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
        <DonutChart collected={stats.collected} total={stats.total} />
        <div className="space-y-2.5 flex-1 min-w-0">
          {[
            { dot: '#2563EB', label: 'Coleccionadas', value: stats.collected  },
            { dot: '#EF4444', label: 'Faltantes',     value: stats.missing    },
            { dot: '#F59E0B', label: 'Repetidas',     value: stats.duplicates },
            { dot: '#9CA3AF', label: 'Total álbum',   value: stats.total      },
          ].map(({ dot, label, value }) => (
            <div key={label} className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
              <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{label}</span>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200 shrink-0">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Selección favorita ── */}
      {favData && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">{FLAG[favAbrv] ?? '🏳️'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tu selección favorita</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{favName}</p>
            </div>
            <span className="text-lg font-bold shrink-0" style={{ color: favColors[0] }}>{favPct}%</span>
          </div>
          <div className="space-y-1">
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${favPct}%`, backgroundColor: favColors[0] }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{favData.collected} de {favData.total} estampas</span>
              {favMissing > 0 && <span>Te faltan {favMissing}</span>}
            </div>
          </div>
          {(favData.duplicates ?? 0) > 0 && (
            <p className="text-xs text-amber-500 font-medium">
              🔄 Tienes {favData.duplicates} repetida{favData.duplicates !== 1 ? 's' : ''} de {favName} para intercambiar
            </p>
          )}
        </div>
      )}

      {/* ── Descripción de la app ── */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0">
            <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
            <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
          </svg>
          <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Tu espacio de coleccionista</p>
        </div>
        <div className="space-y-2.5">
          {[
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z" clipRule="evenodd" />
                </svg>
              ),
              title: 'Estampitas',
              desc: 'Gestiona tu álbum completo, marca las que tienes y las que te sobran',
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 0 1 3.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0 1 21 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 0 1 7.5 16.125V3.375Z" />
                  <path d="M15 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 17.25 7.5h-1.875A.375.375 0 0 1 15 7.125V5.25ZM4.875 6H6v10.125A3.375 3.375 0 0 0 9.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V7.875C3 6.839 3.84 6 4.875 6Z" />
                </svg>
              ),
              title: 'Intercambio',
              desc: 'Conecta con otros coleccionistas y cambia tus repetidas fácilmente',
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M3 4.875C3 3.839 3.839 3 4.875 3h4.5C10.41 3 11.25 3.839 11.25 4.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 0 1 3 9.375v-4.5ZM4.875 4.5a.375.375 0 0 0-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 0 0 .375-.375v-4.5a.375.375 0 0 0-.375-.375h-4.5Zm7.875.375c0-1.036.84-1.875 1.875-1.875h4.5C20.16 3 21 3.839 21 4.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5a1.875 1.875 0 0 1-1.875-1.875v-4.5Zm1.875-.375a.375.375 0 0 0-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 0 0 .375-.375v-4.5a.375.375 0 0 0-.375-.375h-4.5ZM6 6.75A.75.75 0 0 1 6.75 6h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75A.75.75 0 0 1 6 7.5v-.75Zm9.75 0A.75.75 0 0 1 16.5 6h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75ZM3 14.625c0-1.036.84-1.875 1.875-1.875h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.035-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 0 1 3 19.125v-4.5Zm1.875-.375a.375.375 0 0 0-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 0 0 .375-.375v-4.5a.375.375 0 0 0-.375-.375h-4.5Zm7.875-.75a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm6 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75ZM6 16.5a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm9.75 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm-3 3a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm6 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Z" clipRule="evenodd" />
                </svg>
              ),
              title: 'Tu QR personal',
              desc: 'Comparte tu link o QR para que te escaneen y vean qué pueden intercambiar contigo',
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                </svg>
              ),
              title: 'Mi Perfil',
              desc: 'Actualiza tus datos, selección favorita y jugador favorito',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-2.5">
              <span className="text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5">{icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{title}</p>
                <p className="text-xs text-indigo-500/80 dark:text-indigo-300/70 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-indigo-400 dark:text-indigo-400/70 pt-1 border-t border-indigo-100 dark:border-indigo-800/50">
          ¡Mucho ánimo completando el álbum! 🙌
        </p>
      </div>

      {/* ── Rankings ── */}
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

      {/* ── Por selección ── */}
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
