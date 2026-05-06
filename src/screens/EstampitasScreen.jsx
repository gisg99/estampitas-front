import { useEffect, useState } from 'react';
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

const EstampitasScreen = () => {
  const [selecciones,     setSelecciones]     = useState([]);
  const [collection,      setCollection]      = useState([]);
  const [localCollection, setLocalCollection] = useState([]);
  const [isEditing,       setIsEditing]       = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [loading,         setLoading]         = useState(true);

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

  const handleAdd = (id) => {
    setLocalCollection(prev =>
      prev.map(s => s.id === id ? { ...s, quantity: s.quantity + 1 } : s)
    );
  };

  const handleSubtract = (id) => {
    setLocalCollection(prev =>
      prev.map(s => s.id === id ? { ...s, quantity: Math.max(0, s.quantity - 1) } : s)
    );
  };

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

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Cargando...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="sticky top-0 z-20 flex items-center px-4 pt-4 pb-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
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
      {selecciones.map(sel => (
        <AlbumPage
          key={sel.abreviatura}
          seleccion={sel}
          stickers={localCollection.filter(s => s.country_abrv === sel.abreviatura)}
          isEditing={isEditing}
          onAdd={handleAdd}
          onSubtract={handleSubtract}
        />
      ))}
    </div>
  );
};

export default EstampitasScreen;
