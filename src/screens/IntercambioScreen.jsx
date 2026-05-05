import { useEffect, useState } from 'react';
import { getCollection, getSelecciones, removeSticker } from '../api';
const TEAM_COLORS = {
  MEX: ['#006847', '#FFFFFF', '#CE1126'],
  RSA: ['#007A4D', '#FFB612', '#DE3831'],
  KOR: ['#CD2E3A', '#FFFFFF', '#003478'],
  CZE: ['#D7141A', '#FFFFFF', '#11457E'],
  CAN: ['#D80621', '#FFFFFF', '#D80621'],
  BIH: ['#002395', '#FFCD00', '#FFFFFF'],
  QAT: ['#8D1B3D', '#FFFFFF', '#8D1B3D'],
  SUI: ['#D52B1E', '#FFFFFF', '#D52B1E'],
  BRA: ['#009C3B', '#FFDF00', '#002776'],
  MAR: ['#C1272D', '#006233', '#FFFFFF'],
  HAI: ['#00209F', '#D21034', '#000000'],
  SCO: ['#003078', '#FFFFFF', '#003078'],
  USA: ['#002868', '#FFFFFF', '#BF0A30'],
  PAR: ['#D52B1E', '#FFFFFF', '#0038A8'],
  AUS: ['#003DA5', '#FFD700', '#003DA5'],
  TUR: ['#E30A17', '#FFFFFF', '#E30A17'],
  GER: ['#000000', '#DD0000', '#FFCE00'],
  CUW: ['#002B7F', '#F9E814', '#FFFFFF'],
  CIV: ['#F77F00', '#FFFFFF', '#009A44'],
  ECU: ['#FFD100', '#003087', '#CE1126'],
  NED: ['#FF6600', '#FFFFFF', '#003DA5'],
  JPN: ['#BC002D', '#FFFFFF', '#BC002D'],
  SWE: ['#006AA7', '#FECC02', '#006AA7'],
  TUN: ['#E70013', '#FFFFFF', '#E70013'],
  BEL: ['#1A1A1A', '#FAE042', '#EF3340'],
  EGY: ['#CE1126', '#FFFFFF', '#000000'],
  IRN: ['#239F40', '#FFFFFF', '#DA0000'],
  NZL: ['#00247D', '#FFFFFF', '#CC142B'],
  ESP: ['#AA151B', '#F1BF00', '#AA151B'],
  URU: ['#75AADB', '#FFFFFF', '#75AADB'],
  KSA: ['#006C35', '#FFFFFF', '#006C35'],
  CPV: ['#003893', '#CF2027', '#F7D116'],
  FRA: ['#002395', '#FFFFFF', '#ED2939'],
  SEN: ['#00853F', '#FDEF42', '#E31B23'],
  IRQ: ['#CE1126', '#FFFFFF', '#000000'],
  NOR: ['#EF2B2D', '#FFFFFF', '#002868'],
  ARG: ['#74ACDF', '#FFFFFF', '#74ACDF'],
  AUT: ['#ED2939', '#FFFFFF', '#ED2939'],
  ALG: ['#006233', '#FFFFFF', '#D21034'],
  JOR: ['#000000', '#FFFFFF', '#007A3D'],
  POR: ['#006600', '#FF0000', '#FFCB00'],
  COL: ['#FCD116', '#003087', '#CE1126'],
  UZB: ['#1EB53A', '#FFFFFF', '#CE1126'],
  COD: ['#007FFF', '#F7D618', '#CE1126'],
  ENG: ['#CF081F', '#FFFFFF', '#CF081F'],
  CRO: ['#CC0000', '#FFFFFF', '#003DA5'],
  PAN: ['#DA121A', '#FFFFFF', '#0A3DA5'],
  GHA: ['#CF0921', '#FCD116', '#006B3F'],
};

const DEFAULT_COLORS = ['#2563EB', '#FFFFFF', '#1E40AF'];

const IntercambioScreen = () => {
  const [selecciones, setSelecciones] = useState([]);
  const [collection,  setCollection]  = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([getSelecciones(), getCollection()]).then(([sels, col]) => {
      setSelecciones(sels);
      setCollection(col);
      setLoading(false);
    });
  }, []);

  const handleRemove = async (id) => {
    const updated = await removeSticker(id);
    setCollection(prev => prev.map(s => s.id === id ? { ...s, quantity: updated.quantity } : s));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Cargando...</div>;
  }

  const duplicates = collection.filter(s => s.quantity > 1);

  if (duplicates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 p-8">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 opacity-30">
          <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 0 1 3.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0 1 21 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 0 1 7.5 16.125V3.375Z" />
          <path d="M15 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 17.25 7.5h-1.875A.375.375 0 0 1 15 7.125V5.25ZM4.875 6H6v10.125A3.375 3.375 0 0 0 9.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V7.875C3 6.839 3.84 6 4.875 6Z" />
        </svg>
        <p className="text-sm">No tienes repetidas aún</p>
      </div>
    );
  }

  const grouped = selecciones
    .map(sel => ({
      sel,
      colors: TEAM_COLORS[sel.abreviatura] ?? DEFAULT_COLORS,
      stickers: duplicates.filter(s => s.country_abrv === sel.abreviatura),
    }))
    .filter(g => g.stickers.length > 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-bold text-gray-800">Intercambio</h1>
        <span className="text-sm text-amber-500 font-semibold">{duplicates.length} repetidas</span>
      </div>

      {grouped.map(({ sel, colors, stickers }) => (
        <div key={sel.abreviatura} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: colors[0] + '18' }}>
            <div className="flex gap-1">
              {colors.map((c, i) => (
                <div key={i} className="w-2 h-5 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="font-semibold text-gray-700 text-sm">{sel.nombre}</span>
            <span className="text-xs text-gray-400 ml-1">Grupo {sel.grupo}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {stickers.map(s => (
              <div key={s.id} className="flex items-center px-4 py-2.5 gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: colors[0] }}
                >
                  {s.number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 capitalize">{s.content}</p>
                  <p className="text-xs text-gray-400 capitalize">{s.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    ×{s.quantity}
                  </span>
                  <button
                    onClick={() => handleRemove(s.id)}
                    className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center text-lg leading-none hover:bg-red-100 transition-colors"
                  >
                    −
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default IntercambioScreen;
