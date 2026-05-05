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
    perfil:      <PerfilScreen onLogout={handleLogout} />,
  };

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <main className="flex-1 overflow-y-auto">
        {screens[activeTab]}
      </main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
};

export default App;
