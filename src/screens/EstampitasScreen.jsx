import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlbumPage } from '../components/AlbumPage';
import { getCollection, getSelecciones, batchSetStickers } from '../api';

const TEAM_COLORS = {
  FWC: ['#B8860B', '#FFD700', '#DAA520'],
  CC:  ['#CC0000', '#FFFFFF', '#1A1A1A'],
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

const FLAG_MAP = {
  MEX: 'mx',  RSA: 'za',  KOR: 'kr',  CZE: 'cz',
  CAN: 'ca',  BIH: 'ba',  QAT: 'qa',  SUI: 'ch',
  BRA: 'br',  MAR: 'ma',  HAI: 'ht',  SCO: 'gb-sct',
  USA: 'us',  PAR: 'py',  AUS: 'au',  TUR: 'tr',
  GER: 'de',  CUW: 'cw',  CIV: 'ci',  ECU: 'ec',
  NED: 'nl',  JPN: 'jp',  SWE: 'se',  TUN: 'tn',
  BEL: 'be',  EGY: 'eg',  IRN: 'ir',  NZL: 'nz',
  ESP: 'es',  URU: 'uy',  KSA: 'sa',  CPV: 'cv',
  FRA: 'fr',  SEN: 'sn',  IRQ: 'iq',  NOR: 'no',
  ARG: 'ar',  AUT: 'at',  ALG: 'dz',  JOR: 'jo',
  POR: 'pt',  COL: 'co',  UZB: 'uz',  COD: 'cd',
  ENG: 'gb-eng', CRO: 'hr', PAN: 'pa', GHA: 'gh',
};

const FlagCircle = ({ abrv, colors }) => {
  if (abrv === 'FWC') {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#FFD700' }}>
        <span className="text-[7px] font-bold leading-none" style={{ color: '#78530A' }}>FWC</span>
      </div>
    );
  }
  if (abrv === 'CC') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-600">
        <span className="text-[8px] font-bold text-white leading-none">CC</span>
      </div>
    );
  }
  const iso = FLAG_MAP[abrv];
  if (iso) {
    return <img src={`https://flagcdn.com/w40/${iso}.png`} alt={abrv} className="w-full h-full object-cover" />;
  }
  return (
    <div className="w-full h-full flex">
      {colors.map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: c }} />)}
    </div>
  );
};

const EstampitasScreen = () => {
  const [selecciones,     setSelecciones]     = useState([]);
  const [collection,      setCollection]      = useState([]);
  const [localCollection, setLocalCollection] = useState([]);
  const [isEditing,       setIsEditing]       = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [loading,         setLoading]         = useState(true);

  const sectionRefs = useRef({});
  const scrollTo = (abrv) =>
    sectionRefs.current[abrv]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  useEffect(() => {
    Promise.all([getSelecciones(), getCollection()]).then(([sels, col]) => {
      setSelecciones(
        [...sels]
          .sort((a, b) => (a.abreviatura === 'FWC' ? -1 : b.abreviatura === 'FWC' ? 1 : 0))
          .map(s => ({
            ...s,
            colors: TEAM_COLORS[s.abreviatura] ?? ['#2563EB', '#FFFFFF', '#1E40AF'],
          }))
      );
      setCollection(col);
      setLocalCollection(col);
      setLoading(false);
    });
  }, []);

  const handleAdd = useCallback((id) => {
    setLocalCollection(prev =>
      prev.map(s => s.id === id ? { ...s, quantity: s.quantity + 1 } : s)
    );
  }, []);

  const handleSubtract = useCallback((id) => {
    setLocalCollection(prev =>
      prev.map(s => s.id === id ? { ...s, quantity: Math.max(0, s.quantity - 1) } : s)
    );
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const changes = localCollection
        .filter(s => {
          const orig = collection.find(o => o.id === s.id);
          return orig && orig.quantity !== s.quantity;
        })
        .map(s => ({ id: s.id, quantity: s.quantity }));
      await batchSetStickers(changes);
      setCollection(localCollection);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalCollection(collection);
    setIsEditing(false);
  };

  const stickersByCountry = useMemo(() => {
    const map = {};
    for (const s of localCollection) {
      if (!map[s.country_abrv]) map[s.country_abrv] = [];
      map[s.country_abrv].push(s);
    }
    const fwc = map['FWC'] ?? [];
    map['FWC_A'] = fwc.filter(s => s.number <= 8);
    map['FWC_B'] = fwc.filter(s => s.number >= 9);
    return map;
  }, [localCollection]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Cargando...</div>;
  }

  const fwcSel    = selecciones.find(s => s.abreviatura === 'FWC');
  const otherSels = selecciones.filter(s => s.abreviatura !== 'FWC');

  // Lista del índice: FWC_A al inicio, resto en orden, FWC_B al final
  const indexItems = [
    ...(fwcSel ? [{ ...fwcSel, _key: 'FWC_A' }] : []),
    ...otherSels.map(s => ({ ...s, _key: s.abreviatura })),
    ...(fwcSel ? [{ ...fwcSel, _key: 'FWC_B' }] : []),
  ];

  return (
    <div className="space-y-2">
      {isEditing && (
        <div className="fixed bottom-16 inset-x-0 z-40 flex justify-center pointer-events-none">
          <div className="mx-4 mb-2 px-4 py-2.5 bg-gray-900/85 dark:bg-gray-700/90 backdrop-blur-sm rounded-2xl shadow-lg flex flex-col gap-0.5 text-center">
            <p className="text-xs text-white/90">Toca una estampa para agregarla</p>
            <p className="text-xs text-white/90">Mantén pulsada una estampa para quitarla</p>
          </div>
        </div>
      )}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center px-4 pt-4 pb-2">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex-1">Estampitas</h1>
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="text-sm text-gray-500 px-3 py-1.5 rounded-xl border border-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm text-white bg-blue-600 px-3 py-1.5 rounded-xl disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4 3h11l6 6v13H4V3zm3 1v5h6V4H7zm0 10v6h10v-6H7z" clipRule="evenodd" />
                </svg>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-sm text-blue-600 px-3 py-1.5 rounded-xl border border-blue-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
              </svg>
              Editar
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 pb-3 pt-1" style={{ scrollbarWidth: 'none' }}>
          {indexItems.reduce((items, item, i) => {
            const getLabel = (it) => {
              if (!it) return null;
              if (it._key === 'FWC_A' || it._key === 'FWC_B') return 'FWC';
              if (it.abreviatura === 'CC') return 'CC';
              if (/^[A-L]$/.test(it.grupo)) return it.grupo;
              return null;
            };
            const label     = getLabel(item);
            const prevLabel = getLabel(indexItems[i - 1]);
            if (label && label !== prevLabel) {
              items.push(
                <span key={`g-${item._key}`} className="flex-shrink-0 text-[11px] font-bold text-gray-400 pl-1 leading-none">
                  {label}
                </span>
              );
            }
            items.push(
              <button
                key={item._key}
                onClick={() => scrollTo(item._key)}
                className="flex-shrink-0 w-8 h-8 rounded-full rounded-br-none overflow-hidden ring-1 ring-black/10 dark:ring-white/10 active:scale-90 transition-transform"
                title={item.nombre}
              >
                <FlagCircle abrv={item.abreviatura} colors={item.colors} />
              </button>
            );
            return items;
          }, [])}
        </div>
      </div>
      {fwcSel && (
        <div ref={el => { sectionRefs.current['FWC_A'] = el; }} className="scroll-mt-32">
          <AlbumPage
            seleccion={fwcSel}
            stickers={stickersByCountry['FWC_A'] ?? []}
            subtitle="Estampas 00–08"
            isEditing={isEditing}
            onAdd={handleAdd}
            onSubtract={handleSubtract}
          />
        </div>
      )}
      {otherSels.map(sel => (
        <div
          key={sel.abreviatura}
          ref={el => { sectionRefs.current[sel.abreviatura] = el; }}
          className="scroll-mt-32"
        >
          <AlbumPage
            seleccion={sel}
            stickers={stickersByCountry[sel.abreviatura] ?? []}
            isEditing={isEditing}
            onAdd={handleAdd}
            onSubtract={handleSubtract}
          />
        </div>
      ))}
      {fwcSel && (
        <div ref={el => { sectionRefs.current['FWC_B'] = el; }} className="scroll-mt-32">
          <AlbumPage
            seleccion={fwcSel}
            stickers={stickersByCountry['FWC_B'] ?? []}
            subtitle="Estampas 09–19"
            isEditing={isEditing}
            onAdd={handleAdd}
            onSubtract={handleSubtract}
          />
        </div>
      )}
    </div>
  );
};

export default EstampitasScreen;
