const StickerCard = ({ s, colors, owned, onAdd, onRemove }) => {
  const isHolo       = s.type === 'escudo';
  const isHorizontal = s.type === 'alineacion';
  const duplicate    = s.quantity > 1;
  const color        = colors[0];

  const sizeClass = 'w-full aspect-square rounded-3xl rounded-br-sm';

  let cardClass = `relative flex flex-col items-center justify-center text-xs font-semibold transition-all active:scale-95 ${sizeClass}`;
  let cardStyle = {};

  if (isHolo) {
    if (owned) {
      const [c1, c2, c3] = colors;
      cardStyle = {
        background: `linear-gradient(135deg, ${c1}, ${c2}, ${c3}, ${c1}, ${c2}, ${c3}, ${c1})`,
        backgroundSize: '400% 400%',
        animation: 'holo-shift 4s ease infinite',
        border: '3px solid #B8BEC8',
        boxShadow: '0 0 8px rgba(185,195,210,0.6), 0 0 18px rgba(185,195,210,0.25)',
        color: '#fff',
      };
    } else {
      cardClass += ' holo-missing';
      cardStyle = { border: '3px solid #B8BEC8' };
    }
  } else if (owned) {
    cardStyle = {
      backgroundColor: color,
      border: `3px solid ${color}`,
      color: '#fff',
    };
  } else {
    cardStyle = {
      backgroundColor: `${color}22`,
      border: `3px solid ${color}`,
      color: color,
    };
  }

  return (
    <button
      onClick={() => owned ? onRemove(s.id) : onAdd(s.id)}
      className={cardClass}
      style={cardStyle}
    >
      {isHolo && owned && (
        <span
          className="absolute inset-0 overflow-hidden rounded-3xl rounded-br-sm pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <span
            className="absolute top-0 bottom-0 w-8 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent, #fff, transparent)',
              animation: 'holo-shine 2.5s linear infinite',
            }}
          />
        </span>
      )}

      <span className="text-xl relative z-10 leading-none">{s.number}</span>

      {duplicate && (
        <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center z-20">
          {s.quantity}
        </span>
      )}
    </button>
  );
};

const AlbumPage = ({ seleccion, stickers, onAdd, onRemove }) => {
  const colors = seleccion.colors ?? ['#374151', '#6B7280', '#9CA3AF'];
  const color  = colors[0];
  const owned  = stickers.filter(s => s.quantity > 0).length;

  return (
    <div className="p-3 rounded-[3rem] rounded-br-sm" style={{ backgroundColor: color + '78' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="grid grid-cols-3 items-center">
          <div className="w-6 h-6 rounded-full rounded-bl-none -mr-1 -mb-1" style={{ backgroundColor: colors[0] }} /><div/><div/>
          <div/><div className="w-4 h-4 rounded-xl -m-2 z-10" style={{ backgroundColor: colors[1] }} /><div/>
          <div/><div/><div className="w-6 h-6 rounded-full rounded-br-none -ml-6 -mt-1" style={{ backgroundColor: colors[2] }} />
        </div>
        <div>
          <h2
            className="font-medium text-gray-800 text-3xl leading-none"
            style={{ fontFamily: "'Syncopate', sans-serif" }}
          >
            {seleccion.abreviatura}
          </h2>
          <span className="text-[14px] text-gray-900">Grupo {seleccion.grupo}</span>
        </div>
        <span className="ml-auto text-lg text-gray-900 font-semibold">
          {owned}/{stickers.length}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {stickers.map(s => (
          <StickerCard
            key={s.id}
            s={s}
            colors={colors}
            owned={s.quantity > 0}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
};

export { AlbumPage };
