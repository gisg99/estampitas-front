import { useEffect, useState } from 'react';
import { login, signup, getSelecciones } from '../api';

const PLAYERS = [
  { value: 'Lamine Yamal',      label: '🇪🇸 Lamine Yamal — España'    },
  { value: 'Kylian Mbappé',     label: '🇫🇷 Kylian Mbappé — Francia'  },
  { value: 'Cristiano Ronaldo', label: '🇵🇹 Cristiano Ronaldo — Portugal' },
  { value: 'Lionel Messi',      label: '🇦🇷 Lionel Messi — Argentina' },
];

const AuthScreen = ({ onAuth }) => {
  const [tab,         setTab]         = useState('login');
  const [selecciones, setSelecciones] = useState([]);
  const [form,        setForm]        = useState({
    nombre: '', correo: '', password: '',
    fecha_nacimiento: '', genero: '',
    seleccion_favorita: '', jugador_favorito: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSelecciones().then(setSelecciones).catch(() => {});
  }, []);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = tab === 'login'
        ? await login(form.correo, form.password)
        : await signup(
            form.nombre, form.correo, form.password,
            form.fecha_nacimiento, form.genero,
            form.seleccion_favorita || null,
            form.jugador_favorito   || null,
          );

      if (res.error) {
        setError(res.error);
      } else {
        localStorage.setItem('token', res.token);
        onAuth(res.user);
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const grouped = selecciones.reduce((acc, s) => {
    const g = `Grupo ${s.grupo}`;
    (acc[g] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-9 h-9">
              <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 0 1 3.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0 1 21 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 0 1 7.5 16.125V3.375Z" />
              <path d="M15 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 17.25 7.5h-1.875A.375.375 0 0 1 15 7.125V5.25ZM4.875 6H6v10.125A3.375 3.375 0 0 0 9.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V7.875C3 6.839 3.84 6 4.875 6Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Syncopate', sans-serif" }}>
            Estampitas
          </h1>
          <p className="text-sm text-gray-500 mt-1">Mundial 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setTab('signup'); setError(''); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === 'signup' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {tab === 'login' ? (
              <>
                <Field label="Correo"     name="correo"   type="email"    value={form.correo}   onChange={handleChange} placeholder="correo@ejemplo.com" />
                <Field label="Contraseña" name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" />
              </>
            ) : (
              <>
                <Field label="Nombre"     name="nombre"   value={form.nombre}   onChange={handleChange} placeholder="Tu nombre" />
                <Field label="Correo"     name="correo"   type="email"    value={form.correo}   onChange={handleChange} placeholder="correo@ejemplo.com" />
                <Field label="Contraseña" name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" />
                <Field label="Fecha de nacimiento" name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} />

                <Select label="Género" name="genero" value={form.genero} onChange={handleChange} required>
                  <option value="">Selecciona</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                </Select>

                <Select label="Selección favorita" name="seleccion_favorita" value={form.seleccion_favorita} onChange={handleChange} optional>
                  <option value="">— Opcional —</option>
                  {Object.entries(grouped).map(([grupo, sels]) => (
                    <optgroup key={grupo} label={grupo}>
                      {sels.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </optgroup>
                  ))}
                </Select>

                <Select label="Jugador favorito" name="jugador_favorito" value={form.jugador_favorito} onChange={handleChange} optional>
                  <option value="">— Opcional —</option>
                  {PLAYERS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </Select>
              </>
            )}

            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm active:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Cargando...' : tab === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, name, type = 'text', value, onChange, placeholder }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder-gray-300"
    />
  </div>
);

const Select = ({ label, name, value, onChange, required, optional, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {label}{optional && <span className="ml-1 normal-case font-normal text-gray-400">(opcional)</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required && !optional}
      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none bg-white"
    >
      {children}
    </select>
  </div>
);

export default AuthScreen;
