import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  getCollection, getSelecciones, getUser, getTradeProfile, batchSetStickers,
  createTradeRequest, getPendingTradeRequests, acceptTradeRequest, rejectTradeRequest,
} from '../api';
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

const numLabel = (n) => n === 0 ? '00' : String(n).padStart(2, '0');

const StickerPill = ({ s }) => (
  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
    {FLAG[s.country_abrv] ?? '🏳️'} {s.country_abrv}-{numLabel(s.number)}
    <span className="text-gray-400 ml-1">×{s.quantity - 1}</span>
  </span>
);

const TradePill = ({ s }) => {
  const isHolo = s.type === 'escudo';
  const borderColor = TEAM_COLORS[s.country_abrv]?.[0] ?? '#9ca3af';
  const style = isHolo
    ? { background: '#C0C0C0', border: '2px solid #8a8a8a' }
    : { background: '#ffffff', border: `2px solid ${borderColor}` };
  return (
    <div style={style} className="rounded-lg px-2 py-1 inline-flex items-center gap-1">
      <span className="text-sm leading-none">{FLAG[s.country_abrv] ?? '🏳️'}</span>
      <span className="text-xs font-bold text-gray-800">{s.country_abrv}-{numLabel(s.number)}</span>
      {isHolo && <span className="text-[9px] font-bold text-gray-500">✦</span>}
    </div>
  );
};

const IntercambioScreen = ({ tradeUserId, onClearTrade, onPendingCountChange }) => {
  const [selecciones,     setSelecciones]     = useState([]);
  const [collection,      setCollection]      = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [myUserId,        setMyUserId]        = useState(null);
  const [tradeProfile,    setTradeProfile]    = useState(null);
  const [tradeLoading,    setTradeLoading]    = useState(false);
  const [tradeError,      setTradeError]      = useState(null);
  const [simulated,       setSimulated]       = useState(false);
  const [confirming,      setConfirming]      = useState(false);
  const [confirmed,       setConfirmed]       = useState(false);
  const [copied,          setCopied]          = useState(false);
  const [interactiveMode,  setInteractiveMode]  = useState(null); // null | 'selecting' | 'checklist'
  const [agreedTrades,     setAgreedTrades]     = useState([]);   // [{give, receive}]
  const [pendingReceive,   setPendingReceive]   = useState(null);
  const [checkMarks,       setCheckMarks]       = useState({});
  const [pendingRequests,  setPendingRequests]  = useState([]);
  const [requestAction,    setRequestAction]    = useState({}); // {[id]: 'accepting'|'rejecting'|'error'}
  const [showRequests,     setShowRequests]     = useState(false);

  useEffect(() => {
    Promise.all([getSelecciones(), getCollection(), getUser(), getPendingTradeRequests()])
      .then(([sels, col, user, pending]) => {
        setSelecciones(sels);
        setCollection(col);
        setMyUserId(user?.id ?? null);
        setPendingRequests(Array.isArray(pending) ? pending : []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    onPendingCountChange?.(pendingRequests.length);
  }, [pendingRequests.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!tradeUserId) { setTradeProfile(null); setTradeError(null); return; }
    setTradeLoading(true);
    setSimulated(false);
    setConfirmed(false);
    setInteractiveMode(null);
    setAgreedTrades([]);
    setPendingReceive(null);
    setCheckMarks({});
    getTradeProfile(tradeUserId)
      .then(p => { if (p.error) setTradeError(p.error); else setTradeProfile(p); })
      .catch(() => setTradeError('No se pudo cargar el perfil'))
      .finally(() => setTradeLoading(false));
  }, [tradeUserId]);

  // ── Trade computation ──────────────────────────────────────────────────────
  const tradeData = useMemo(() => {
    if (!tradeProfile || !collection.length) return null;

    const myMissing    = new Set(collection.filter(s => s.quantity === 0).map(s => s.id));
    const theirMissing = new Set(tradeProfile.stickers.filter(s => s.quantity === 0).map(s => s.sticker_id));

    const canGive = collection
      .filter(s => s.quantity > 1 && theirMissing.has(s.id))
      .sort((a, b) => b.quantity - a.quantity);

    const canReceive = tradeProfile.stickers
      .filter(s => s.quantity > 1 && myMissing.has(s.sticker_id))
      .sort((a, b) => b.quantity - a.quantity);

    return { canGive, canReceive, tradeCount: Math.min(canGive.length, canReceive.length) };
  }, [tradeProfile, collection]);

  // ── Confirm auto-simulated trade ───────────────────────────────────────────
  const confirmTrade = async () => {
    if (!tradeData) return;
    const { canGive, canReceive, tradeCount } = tradeData;
    setConfirming(true);
    try {
      const changes = [];
      for (let i = 0; i < tradeCount; i++) {
        changes.push({ id: canGive[i].id,             quantity: canGive[i].quantity - 1 });
        const mySticker = collection.find(s => s.id === canReceive[i].sticker_id);
        changes.push({ id: canReceive[i].sticker_id, quantity: (mySticker?.quantity ?? 0) + 1 });
      }
      await batchSetStickers(changes);
      const newCollection = await getCollection();
      setCollection(newCollection);
      setSimulated(false);
      setConfirmed(true);
    } finally {
      setConfirming(false);
    }
  };

  // ── Confirm interactive trade ──────────────────────────────────────────────
  const confirmInteractiveTrade = async () => {
    setConfirming(true);
    try {
      // 1. Actualizar colección propia
      const changes = [];
      for (const { give, receive } of agreedTrades) {
        changes.push({ id: give.id,            quantity: give.quantity - 1 });
        const mySticker = collection.find(s => s.id === receive.sticker_id);
        changes.push({ id: receive.sticker_id, quantity: (mySticker?.quantity ?? 0) + 1 });
      }
      await batchSetStickers(changes);
      const newCollection = await getCollection();
      setCollection(newCollection);

      // 2. Mandar solicitud a la otra persona
      // Desde la perspectiva de B: da receive.sticker_id, recibe give.id
      await createTradeRequest(tradeUserId, agreedTrades.map(({ give, receive }) => ({
        give_sticker_id:    receive.sticker_id,
        receive_sticker_id: give.id,
      })));

      setConfirmed(true);
    } finally {
      setConfirming(false);
    }
  };

  // ── Trade request handlers ─────────────────────────────────────────────────
  const handleAccept = async (id) => {
    setRequestAction(prev => ({ ...prev, [id]: 'accepting' }));
    try {
      await acceptTradeRequest(id);
      const newCollection = await getCollection();
      setCollection(newCollection);
      setPendingRequests(prev => prev.filter(r => r.id !== id));
    } catch {
      setRequestAction(prev => ({ ...prev, [id]: 'error' }));
    }
  };

  const handleReject = async (id) => {
    setRequestAction(prev => ({ ...prev, [id]: 'rejecting' }));
    await rejectTradeRequest(id);
    setPendingRequests(prev => prev.filter(r => r.id !== id));
  };

  // ── Share link ─────────────────────────────────────────────────────────────
  const copyLink = async () => {
    if (!myUserId) return;
    await navigator.clipboard.writeText(`https://estampitas-front.vercel.app/?trade=${myUserId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ──────────────────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Cargando...</div>;
  }

  // ── TRADE VIEW ─────────────────────────────────────────────────────────────
  if (tradeUserId) {
    if (tradeLoading) {
      return <div className="flex items-center justify-center h-full text-gray-400">Cargando perfil...</div>;
    }
    if (tradeError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
          <p className="text-red-400 text-sm">{tradeError}</p>
          <button onClick={onClearTrade} className="text-blue-500 text-sm">← Volver</button>
        </div>
      );
    }
    if (!tradeProfile || !tradeData) {
      return <div className="flex items-center justify-center h-full text-gray-400">Cargando...</div>;
    }

    const { canGive, canReceive, tradeCount } = tradeData;

    // ── Available pools for interactive selection ──────────────────────────
    const usedGiveIds    = new Set(agreedTrades.map(t => t.give.id));
    const usedReceiveIds = new Set(agreedTrades.map(t => t.receive.sticker_id));

    const availableToReceive = canReceive.filter(s => !usedReceiveIds.has(s.sticker_id));
    const availableToGive    = canGive.filter(s => {
      if (usedGiveIds.has(s.id)) return false;
      if (!pendingReceive) return true;
      return (s.type === 'escudo') === (pendingReceive.type === 'escudo');
    });

    // ── PASO 1: Selección interactiva ──────────────────────────────────────
    if (interactiveMode === 'selecting') {
      return (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setInteractiveMode(null); setAgreedTrades([]); setPendingReceive(null); }}
                className="text-blue-500 text-sm font-medium"
              >← Cancelar</button>
              <div className="flex-1">
                <h1 className="text-base font-bold text-gray-800 dark:text-gray-100">
                  Con {tradeProfile.name}
                </h1>
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Paso 1 de 2 · Acordar</p>
              </div>
            </div>

            {/* Lista acordada */}
            {agreedTrades.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Acordado · {agreedTrades.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {agreedTrades.map((trade, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                        <TradePill s={trade.give} />
                        <span className="text-gray-400 text-xs">→</span>
                        <TradePill s={{ ...trade.receive, id: trade.receive.sticker_id }} />
                      </div>
                      <button
                        onClick={() => setAgreedTrades(prev => prev.filter((_, j) => j !== i))}
                        className="text-red-400 text-sm leading-none px-1 shrink-0"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Área de selección */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
              {!pendingReceive ? (
                <>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    ¿Qué quieres recibir?
                  </p>
                  {availableToReceive.length === 0 ? (
                    <p className="text-sm text-gray-400">No quedan estampas por recibir</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableToReceive.map(s => (
                        <button
                          key={s.sticker_id}
                          onClick={() => setPendingReceive(s)}
                          className="active:scale-95 transition-transform"
                        >
                          <TradePill s={{ ...s, id: s.sticker_id }} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 font-medium shrink-0">Recibes:</span>
                    <TradePill s={{ ...pendingReceive, id: pendingReceive.sticker_id }} />
                    <button
                      onClick={() => setPendingReceive(null)}
                      className="ml-auto text-xs text-gray-400 underline shrink-0"
                    >Cambiar</button>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    ¿Qué das a cambio?{' '}
                    <span className="font-normal text-gray-400 text-xs">
                      {pendingReceive.type === 'escudo' ? '(solo holos)' : '(solo normales)'}
                    </span>
                  </p>
                  {availableToGive.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      No tienes estampas del tipo correcto disponibles
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableToGive.map(s => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setAgreedTrades(prev => [...prev, { give: s, receive: pendingReceive }]);
                            setPendingReceive(null);
                          }}
                          className="active:scale-95 transition-transform"
                        >
                          <TradePill s={s} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bottom */}
          <div className="shrink-0 p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            {agreedTrades.length > 0 ? (
              <button
                onClick={() => { setPendingReceive(null); setCheckMarks({}); setInteractiveMode('checklist'); }}
                className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
              >
                Continuar con {agreedTrades.length} {agreedTrades.length === 1 ? 'intercambio' : 'intercambios'} →
              </button>
            ) : (
              <p className="text-center text-xs text-gray-400">
                Selecciona al menos un intercambio para continuar
              </p>
            )}
          </div>
        </div>
      );
    }

    // ── PASO 2: Checklist de entrega ───────────────────────────────────────
    if (interactiveMode === 'checklist') {
      const allChecked = agreedTrades.every((_, i) =>
        checkMarks[`${i}-give`] && checkMarks[`${i}-receive`]
      );

      return (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setConfirmed(false); setInteractiveMode('selecting'); }}
                className="text-blue-500 text-sm font-medium"
              >← Editar lista</button>
              <div className="flex-1">
                <h1 className="text-base font-bold text-gray-800 dark:text-gray-100">
                  Con {tradeProfile.name}
                </h1>
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Paso 2 de 2 · Entregar</p>
              </div>
            </div>

            {confirmed && (
              <p className="text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                ¡Intercambio registrado! 🎉
              </p>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
              {agreedTrades.map((trade, i) => (
                <div key={i} className="p-4 space-y-3">
                  {/* Par de estampas */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <TradePill s={trade.give} />
                    <span className="text-gray-400 text-sm">↔</span>
                    <TradePill s={{ ...trade.receive, id: trade.receive.sticker_id }} />
                  </div>
                  {/* Checkboxes */}
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!checkMarks[`${i}-give`]}
                        onChange={e => setCheckMarks(prev => ({ ...prev, [`${i}-give`]: e.target.checked }))}
                        className="w-4 h-4 rounded accent-emerald-600"
                      />
                      <span className={`text-sm transition-colors ${checkMarks[`${i}-give`] ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        Di {FLAG[trade.give.country_abrv] ?? '🏳️'} {trade.give.country_abrv}-{numLabel(trade.give.number)}
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!checkMarks[`${i}-receive`]}
                        onChange={e => setCheckMarks(prev => ({ ...prev, [`${i}-receive`]: e.target.checked }))}
                        className="w-4 h-4 rounded accent-emerald-600"
                      />
                      <span className={`text-sm transition-colors ${checkMarks[`${i}-receive`] ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        Recibí {FLAG[trade.receive.country_abrv] ?? '🏳️'} {trade.receive.country_abrv}-{numLabel(trade.receive.number)}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="shrink-0 p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={confirmInteractiveTrade}
              disabled={!allChecked || confirming || confirmed}
              className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform disabled:opacity-40"
            >
              {confirming ? 'Registrando…' : confirmed ? '¡Listo! ✓' : '✓ Confirmar intercambio'}
            </button>
          </div>
        </div>
      );
    }

    // ── Vista principal del perfil de intercambio ──────────────────────────
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button onClick={onClearTrade} className="text-blue-500 text-sm font-medium">← Volver</button>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex-1 truncate">
              Con {tradeProfile.name}
            </h1>
          </div>

          {/* Summary banner */}
          <div className={`rounded-2xl p-4 text-center ${tradeCount > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
            {tradeCount > 0 ? (
              <>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{tradeCount}</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {tradeCount === 1 ? 'intercambio posible' : 'intercambios posibles'}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No hay intercambios posibles por ahora</p>
            )}
          </div>

          {/* Simulated trades */}
          {simulated && tradeCount > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="grid grid-cols-2 bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">📤 Tú das</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">📥 Tú recibes</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {Array.from({ length: tradeCount }, (_, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 px-4 py-2.5">
                    <TradePill s={canGive[i]} />
                    <TradePill s={{ ...canReceive[i], id: canReceive[i].sticker_id }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What I can give */}
          {canGive.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Tú le puedes dar · {canGive.length}
              </p>
              <div className="flex flex-wrap gap-2">
                {canGive.map(s => <StickerPill key={s.id} s={s} />)}
              </div>
            </div>
          )}

          {/* What they can give me */}
          {canReceive.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {tradeProfile.name} te puede dar · {canReceive.length}
              </p>
              <div className="flex flex-wrap gap-2">
                {canReceive.map(s => <StickerPill key={s.sticker_id} s={{ ...s, id: s.sticker_id }} />)}
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        {tradeCount > 0 && (
          <div className="shrink-0 p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 space-y-2">
            {confirmed && (
              <p className="text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                ¡Intercambio registrado! 🎉
              </p>
            )}
            <button
              onClick={() => {
                setSimulated(false);
                setConfirmed(false);
                setAgreedTrades([]);
                setPendingReceive(null);
                setCheckMarks({});
                setInteractiveMode('selecting');
              }}
              className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
            >
              🤝 Armar intercambio a mano
            </button>
            <span className='text-xs text-center text-gray-500'>Ambos seleccionen una por una las estampitas que se intercambiarán</span>
            <button
              onClick={() => { setSimulated(v => !v); setConfirmed(false); }}
              className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
            >
              {simulated ? 'Ocultar simulación' : `Simular ${tradeCount} intercambio${tradeCount > 1 ? 's' : ''}`}
            </button>
            <span className='text-xs text-center text-gray-500'>Automáticamente se genera el intercambio más eficiente según nuestro algoritmo</span>
            {simulated && (
              <button
                onClick={() => {
                  setAgreedTrades(
                    Array.from({ length: tradeCount }, (_, i) => ({
                      give:    canGive[i],
                      receive: canReceive[i],
                    }))
                  );
                  setCheckMarks({});
                  setSimulated(false);
                  setInteractiveMode('checklist');
                }}
                className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
              >
                ✓ Confirmar intercambio
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── MY DUPLICATES VIEW ─────────────────────────────────────────────────────
  const duplicates = collection.filter(s => s.quantity > 1);

  const tradeLink = myUserId ? `https://estampitas-front.vercel.app/?trade=${myUserId}` : '';

  const grouped = selecciones
    .map(sel => ({
      sel,
      flag: FLAG[sel.abreviatura] ?? '🏳️',
      stickers: duplicates
        .filter(s => s.country_abrv === sel.abreviatura)
        .sort((a, b) => a.number - b.number),
    }))
    .filter(g => g.stickers.length > 0);

  const totalExtras = duplicates.reduce((sum, s) => sum + s.quantity - 1, 0);

  const buildMessage = () => {
    const lines = grouped.map(({ sel, flag, stickers }) => {
      const nums = stickers.map(s => {
        const extras = s.quantity - 1;
        return extras === 1 ? numLabel(s.number) : `${numLabel(s.number)}×${extras}`;
      }).join(', ');
      return `${flag} ${sel.abreviatura}: ${nums}`;
    });
    return `🏆 Colección Estampitas 2026 App\n\nMis repetidas 🔄\n\n${lines.join('\n')}\n\nEntra a la app aquí:\nhttps://estampitas-front.vercel.app/`;
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(buildMessage())}`, '_blank');
  };

  const pendingSection = pendingRequests.length > 0 && (
    <button
      onClick={() => setShowRequests(true)}
      className="w-full flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl px-4 py-3 active:scale-[0.99] transition-transform"
    >
      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
      <span className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex-1 text-left">
        Tienes {pendingRequests.length} solicitud{pendingRequests.length !== 1 ? 'es' : ''} pendiente{pendingRequests.length !== 1 ? 's' : ''}
      </span>
      <span className="text-amber-600 text-sm">→</span>
    </button>
  );

  if (showRequests) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRequests(false)}
              className="text-blue-500 text-sm font-medium"
            >← Volver</button>
            <h1 className="text-base font-bold text-gray-800 dark:text-gray-100 flex-1">
              Solicitudes pendientes{pendingRequests.length > 0 ? ` · ${pendingRequests.length}` : ''}
            </h1>
          </div>

          {pendingRequests.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">No hay solicitudes pendientes</p>
          )}

          {pendingRequests.map(req => {
            const busy = requestAction[req.id] === 'accepting' || requestAction[req.id] === 'rejecting';
            return (
              <div key={req.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-200 dark:border-amber-700 overflow-hidden">
                <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Solicitud de {req.from_name}
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">📤 Das</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">📥 Recibes</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {req.trades.map((trade, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2 px-3 py-2">
                          <TradePill s={trade.give} />
                          <TradePill s={trade.receive} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={busy}
                      className="flex-1 py-2.5 rounded-xl border border-red-300 text-red-500 text-sm font-semibold active:scale-95 transition-transform disabled:opacity-40"
                    >
                      {requestAction[req.id] === 'rejecting' ? 'Rechazando…' : 'Rechazar'}
                    </button>
                    <button
                      onClick={() => handleAccept(req.id)}
                      disabled={busy}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold active:scale-95 transition-transform disabled:opacity-40"
                    >
                      {requestAction[req.id] === 'accepting' ? 'Aceptando…' : 'Aceptar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (duplicates.length === 0) {
    return (
      <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
        {pendingSection}
        <div className="flex flex-col items-center gap-3 text-gray-400 py-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 opacity-30">
            <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 0 1 3.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0 1 21 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 0 1 7.5 16.125V3.375Z" />
            <path d="M15 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 17.25 7.5h-1.875A.375.375 0 0 1 15 7.125V5.25ZM4.875 6H6v10.125A3.375 3.375 0 0 0 9.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V7.875C3 6.839 3.84 6 4.875 6Z" />
          </svg>
          <p className="text-sm">No tienes repetidas aún</p>
        </div>
        {myUserId && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-3">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Intercambia conmigo
            </p>
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <QRCodeSVG value={tradeLink} size={160} level="M" />
            </div>
            <div className="w-full space-y-2 pt-1">
              <button
                onClick={copyLink}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
              >
                {copied ? '¡Link copiado! 🎉' : '🔗 Compartir link de intercambio'}
              </button>
              <button
                onClick={shareWhatsApp}
                className="w-full bg-[#25D366] text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Compartir por WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-baseline gap-2 py-1">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Intercambio</h1>
          <span className="text-sm text-red-500 font-semibold">{totalExtras} para cambiar</span>
        </div>

        {pendingSection}

        {/* QR card */}
        {myUserId && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-3">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Intercambia conmigo
            </p>
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <QRCodeSVG value={tradeLink} size={160} level="M" />
            </div>
            <div className="w-full space-y-2 pt-1">
              <button
                onClick={copyLink}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
              >
                {copied ? '¡Link copiado! 🎉' : '🔗 Compartir link de intercambio'}
              </button>
              <button
                onClick={shareWhatsApp}
                className="w-full bg-[#25D366] text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Compartir por WhatsApp
              </button>
            </div>
          </div>
        )}
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Mis repetidas</h1>
        {grouped.map(({ sel, flag, stickers }) => {
          const extras = stickers.reduce((sum, s) => sum + s.quantity - 1, 0);
          return (
            <div key={sel.abreviatura} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl leading-none">{flag}</span>
                <span className="font-bold text-gray-800 dark:text-gray-100 text-sm" style={{ fontFamily: "'Syncopate', sans-serif" }}>
                  {sel.abreviatura}
                </span>
                {/^[A-L]$/.test(sel.grupo) && (
                  <span className="text-xs text-gray-400">Grupo {sel.grupo}</span>
                )}
                <span className="ml-auto text-xs font-semibold text-red-500">×{extras} para cambiar</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {stickers.map(s => {
                  const sExtras = s.quantity - 1;
                  return (
                    <span key={s.id} className="relative inline-flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg px-2.5 py-1.5 text-sm font-bold text-gray-700 dark:text-gray-200 min-w-[2.25rem]">
                      {numLabel(s.number)}
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] px-0.5 flex items-center justify-center leading-none">
                        ×{sExtras}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IntercambioScreen;
