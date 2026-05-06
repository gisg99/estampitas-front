import { useState } from "react";
import BottomNav from "./components/BottomNav";
import InicioScreen from "./screens/InicioScreen";
import EstampitasScreen from "./screens/EstampitasScreen";
import IntercambioScreen from "./screens/IntercambioScreen";
import PerfilScreen from "./screens/PerfilScreen";
import AuthScreen from "./screens/AuthScreen";
import { logout } from "./api";

const App = () => {
  const [token,     setToken]     = useState(() => localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState("inicio");
  const [darkMode,  setDarkMode]  = useState(() => {
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

  const handleAuth = (user) => {
    setToken(localStorage.getItem('token'));
    setActiveTab("inicio");
  };

  const handleLogout = () => {
    logout();
    setToken(null);
  };

  if (!token) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  const screens = {
    inicio:      <InicioScreen />,
    estampitas:  <EstampitasScreen />,
    intercambio: <IntercambioScreen />,
    perfil:      <PerfilScreen onLogout={handleLogout} darkMode={darkMode} onToggleDark={toggleDark} />,
  };

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto pb-16">
        {screens[activeTab]}
      </main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
};

export default App;
