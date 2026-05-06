import { useState } from "react";
import BottomNav from "./components/BottomNav";
import InicioScreen from "./screens/InicioScreen";
import EstampitasScreen from "./screens/EstampitasScreen";
import IntercambioScreen from "./screens/IntercambioScreen";
import PerfilScreen from "./screens/PerfilScreen";
import AuthScreen from "./screens/AuthScreen";
import { logout } from "./api";

const getTradeParam = () => {
  const v = new URLSearchParams(window.location.search).get('trade');
  if (v) window.history.replaceState({}, '', window.location.pathname);
  return v;
};

const App = () => {
  const [token,       setToken]       = useState(() => localStorage.getItem('token'));
  const [activeTab,   setActiveTab]   = useState("inicio");
  const [tradeUserId, setTradeUserId] = useState(() => getTradeParam());
  const [darkMode,    setDarkMode]    = useState(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    if (saved) document.documentElement.classList.add('dark');
    return saved;
  });

  const toggleDark = () => {
    setDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('darkMode', next);
      return next;
    });
  };

  const handleAuth = () => {
    setToken(localStorage.getItem('token'));
    setActiveTab(tradeUserId ? 'intercambio' : 'inicio');
  };

  const handleLogout = () => {
    logout();
    setToken(null);
  };

  const handleTabChange = (tab) => {
    if (tab !== 'intercambio') setTradeUserId(null);
    setActiveTab(tab);
  };

  if (!token) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  // Switch to intercambio if trade param was in URL
  if (tradeUserId && activeTab !== 'intercambio') {
    setActiveTab('intercambio');
  }

  const screens = {
    inicio:      <InicioScreen />,
    estampitas:  <EstampitasScreen />,
    intercambio: <IntercambioScreen tradeUserId={tradeUserId} onClearTrade={() => setTradeUserId(null)} />,
    perfil:      <PerfilScreen onLogout={handleLogout} darkMode={darkMode} onToggleDark={toggleDark} />,
  };

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto pb-16">
        {screens[activeTab]}
      </main>
      <BottomNav active={activeTab} onChange={handleTabChange} />
    </div>
  );
};

export default App;
