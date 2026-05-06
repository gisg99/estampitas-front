import { useRef } from 'react';

const StickerCard = ({ s, colors, owned, isEditing, onAdd, onSubtract }) => {
  const pressTimer   = useRef(null);
  const didLongPress = useRef(false);
  const startPos     = useRef({ x: 0, y: 0 });

  const isHolo    = s.type === 'escudo';
  const duplicate = s.quantity > 1;
  const color     = colors[0];

  const sizeClass = 'w-full aspect-square rounded-3xl rounded-br-sm';
  let cardClass = `relative flex flex-col items-center justify-center text-xs font-semibold transition-all ${sizeClass}`;
  if (isEditing) cardClass += ' active:scale-95 touch-none select-none';
  else           cardClass += ' cursor-default';

  let cardStyle = { WebkitUserSelect: 'none', userSelect: 'none' };

  if (isHolo) {
    if (owned) {
      const [c1, c2, c3] = colors;
      cardStyle = {
        ...cardStyle,
        background: `linear-gradient(135deg, ${c1}, ${c2}, ${c3}, ${c1}, ${c2}, ${c3}, ${c1})`,
        backgroundSize: '400% 400%',
        animation: 'holo-shift 4s ease infinite',
        border: '3px solid #B8BEC8',
        boxShadow: '0 0 8px rgba(185,195,210,0.6), 0 0 18px rgba(185,195,210,0.25)',
        color: '#fff',
      };
    } else {
      cardClass += ' holo-missing';
      cardStyle = { ...cardStyle, border: '3px solid #B8BEC8' };
    }
  } else if (owned) {
    cardStyle = { ...cardStyle, backgroundColor: color, border: `3px solid ${color}`, color: '#fff' };
  } else {
    cardStyle = { ...cardStyle, backgroundColor: `${color}22`, border: `3px solid ${color}`, color };
  }

  const onPointerDown = (e) => {
    if (!isEditing) return;
    didLongPress.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onSubtract(s.id);
    }, 500);
  };

  const onPointerUp = () => {
    if (!isEditing) return;
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (!didLongPress.current) onAdd(s.id);
    didLongPress.current = false;
  };

  const onPointerMove = (e) => {
    if (!pressTimer.current) return;
    if (Math.abs(e.clientX - startPos.current.x) > 8 ||
        Math.abs(e.clientY - startPos.current.y) > 8) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    didLongPress.current = false;
  };

  return (
    <button
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onContextMenu={e => e.preventDefault()}
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

      <span className="text-xl relative z-10 leading-none">{s.number === 0 ? '00' : s.number}</span>

      {duplicate && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[1rem] h-4 px-0.5 flex items-center justify-center z-20">
          x{s.quantity - 1}
        </span>
      )}
    </button>
  );
};

const AlbumPage = ({ seleccion, stickers, isEditing, onAdd, onSubtract }) => {
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
            className="font-medium text-gray-800 dark:text-gray-100 text-3xl leading-none"
            style={{ fontFamily: "'Syncopate', sans-serif" }}
          >
            {seleccion.abreviatura}
          </h2>
          {/^[A-L]$/.test(seleccion.grupo)
            ? <span className="text-[14px] text-gray-900 dark:text-gray-300">Grupo {seleccion.grupo}</span>
            : seleccion.abreviatura === 'FWC'
              ? <span className="text-[14px] text-gray-900 dark:text-gray-300">FIFA World Cup 2026™</span>
              : null
          }
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
            isEditing={isEditing}
            onAdd={onAdd}
            onSubtract={onSubtract}
          />
        ))}
      </div>
    </div>
  );
};

export { AlbumPage };
