import { useEffect, useState } from 'react';
import { AlbumPage } from '../components/AlbumPage';
import { getCollection, getSelecciones, addSticker, removeSticker } from '../api';

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

const EstampitasScreen = () => {
  const [selecciones, setSelecciones] = useState([]);
  const [collection,  setCollection]  = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([getSelecciones(), getCollection()]).then(([sels, col]) => {
      setSelecciones(sels.map(s => ({
        ...s,
        colors: TEAM_COLORS[s.abreviatura] ?? ['#2563EB', '#FFFFFF', '#1E40AF'],
      })));
      setCollection(col);
      setLoading(false);
    });
  }, []);

  const handleAdd = async (id) => {
    const updated = await addSticker(id);
    setCollection(prev => prev.map(s => s.id === id ? { ...s, quantity: updated.quantity } : s));
  };

  const handleRemove = async (id) => {
    const updated = await removeSticker(id);
    setCollection(prev => prev.map(s => s.id === id ? { ...s, quantity: updated.quantity } : s));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Cargando...</div>;
  }

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-bold text-gray-800 p-4">Estampitas</h1>
      {selecciones.map(sel => (
        <AlbumPage
          key={sel.abreviatura}
          seleccion={sel}
          stickers={collection.filter(s => s.country_abrv === sel.abreviatura)}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
};

export default EstampitasScreen;
