import { useEffect, useState } from 'react';
import { getUser, updateUser, getSelecciones } from '../api';

const COUNTRIES = [
  { code: 'AF', name: 'Afganistán' }, { code: 'AL', name: 'Albania' },
  { code: 'DE', name: 'Alemania' },   { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' },     { code: 'AG', name: 'Antigua y Barbuda' },
  { code: 'SA', name: 'Arabia Saudita' }, { code: 'DZ', name: 'Argelia' },
  { code: 'AR', name: 'Argentina' },  { code: 'AM', name: 'Armenia' },
  { code: 'AU', name: 'Australia' },  { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaiyán' }, { code: 'BS', name: 'Bahamas' },
  { code: 'BH', name: 'Baréin' },     { code: 'BD', name: 'Bangladés' },
  { code: 'BB', name: 'Barbados' },   { code: 'BY', name: 'Bielorrusia' },
  { code: 'BE', name: 'Bélgica' },    { code: 'BZ', name: 'Belice' },
  { code: 'BJ', name: 'Benín' },      { code: 'BT', name: 'Bután' },
  { code: 'BO', name: 'Bolivia' },    { code: 'BA', name: 'Bosnia y Herzegovina' },
  { code: 'BW', name: 'Botsuana' },   { code: 'BR', name: 'Brasil' },
  { code: 'BN', name: 'Brunéi' },     { code: 'BG', name: 'Bulgaria' },
  { code: 'BF', name: 'Burkina Faso' }, { code: 'BI', name: 'Burundi' },
  { code: 'CV', name: 'Cabo Verde' }, { code: 'KH', name: 'Camboya' },
  { code: 'CM', name: 'Camerún' },    { code: 'CA', name: 'Canadá' },
  { code: 'QA', name: 'Catar' },      { code: 'TD', name: 'Chad' },
  { code: 'CL', name: 'Chile' },      { code: 'CN', name: 'China' },
  { code: 'CY', name: 'Chipre' },     { code: 'CO', name: 'Colombia' },
  { code: 'KM', name: 'Comoras' },    { code: 'CG', name: 'Congo' },
  { code: 'CD', name: 'Congo (RD)' }, { code: 'KP', name: 'Corea del Norte' },
  { code: 'KR', name: 'Corea del Sur' }, { code: 'CR', name: 'Costa Rica' },
  { code: 'CI', name: 'Costa de Marfil' }, { code: 'HR', name: 'Croacia' },
  { code: 'CU', name: 'Cuba' },       { code: 'CW', name: 'Curazao' },
  { code: 'DK', name: 'Dinamarca' },  { code: 'DJ', name: 'Yibuti' },
  { code: 'DM', name: 'Dominica' },   { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egipto' },     { code: 'SV', name: 'El Salvador' },
  { code: 'AE', name: 'Emiratos Árabes Unidos' }, { code: 'ER', name: 'Eritrea' },
  { code: 'SK', name: 'Eslovaquia' }, { code: 'SI', name: 'Eslovenia' },
  { code: 'ES', name: 'España' },     { code: 'US', name: 'Estados Unidos' },
  { code: 'EE', name: 'Estonia' },    { code: 'ET', name: 'Etiopía' },
  { code: 'PH', name: 'Filipinas' },  { code: 'FI', name: 'Finlandia' },
  { code: 'FJ', name: 'Fiyi' },       { code: 'FR', name: 'Francia' },
  { code: 'GA', name: 'Gabón' },      { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Georgia' },    { code: 'GH', name: 'Ghana' },
  { code: 'GD', name: 'Granada' },    { code: 'GR', name: 'Grecia' },
  { code: 'GT', name: 'Guatemala' },  { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bisáu' }, { code: 'GQ', name: 'Guinea Ecuatorial' },
  { code: 'GY', name: 'Guyana' },     { code: 'HT', name: 'Haití' },
  { code: 'HN', name: 'Honduras' },   { code: 'HU', name: 'Hungría' },
  { code: 'IN', name: 'India' },      { code: 'ID', name: 'Indonesia' },
  { code: 'IQ', name: 'Irak' },       { code: 'IR', name: 'Irán' },
  { code: 'IE', name: 'Irlanda' },    { code: 'IS', name: 'Islandia' },
  { code: 'IL', name: 'Israel' },     { code: 'IT', name: 'Italia' },
  { code: 'JM', name: 'Jamaica' },    { code: 'JP', name: 'Japón' },
  { code: 'JO', name: 'Jordania' },   { code: 'KZ', name: 'Kazajistán' },
  { code: 'KE', name: 'Kenia' },      { code: 'KG', name: 'Kirguistán' },
  { code: 'KW', name: 'Kuwait' },     { code: 'LA', name: 'Laos' },
  { code: 'LS', name: 'Lesoto' },     { code: 'LV', name: 'Letonia' },
  { code: 'LB', name: 'Líbano' },     { code: 'LR', name: 'Liberia' },
  { code: 'LY', name: 'Libia' },      { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lituania' },   { code: 'LU', name: 'Luxemburgo' },
  { code: 'MG', name: 'Madagascar' }, { code: 'MY', name: 'Malasia' },
  { code: 'MW', name: 'Malaui' },     { code: 'MV', name: 'Maldivas' },
  { code: 'ML', name: 'Malí' },       { code: 'MT', name: 'Malta' },
  { code: 'MA', name: 'Marruecos' },  { code: 'MU', name: 'Mauricio' },
  { code: 'MR', name: 'Mauritania' }, { code: 'MX', name: 'México' },
  { code: 'FM', name: 'Micronesia' }, { code: 'MD', name: 'Moldavia' },
  { code: 'MC', name: 'Mónaco' },     { code: 'MN', name: 'Mongolia' },
  { code: 'ME', name: 'Montenegro' }, { code: 'MZ', name: 'Mozambique' },
  { code: 'MM', name: 'Myanmar' },    { code: 'NA', name: 'Namibia' },
  { code: 'NR', name: 'Nauru' },      { code: 'NP', name: 'Nepal' },
  { code: 'NI', name: 'Nicaragua' },  { code: 'NE', name: 'Níger' },
  { code: 'NG', name: 'Nigeria' },    { code: 'NO', name: 'Noruega' },
  { code: 'NZ', name: 'Nueva Zelanda' }, { code: 'OM', name: 'Omán' },
  { code: 'NL', name: 'Países Bajos' }, { code: 'PK', name: 'Pakistán' },
  { code: 'PA', name: 'Panamá' },     { code: 'PG', name: 'Papúa Nueva Guinea' },
  { code: 'PY', name: 'Paraguay' },   { code: 'PE', name: 'Perú' },
  { code: 'PL', name: 'Polonia' },    { code: 'PT', name: 'Portugal' },
  { code: 'DO', name: 'Rep. Dominicana' }, { code: 'CZ', name: 'Rep. Checa' },
  { code: 'CF', name: 'Rep. Centroafricana' }, { code: 'RW', name: 'Ruanda' },
  { code: 'RO', name: 'Rumania' },    { code: 'RU', name: 'Rusia' },
  { code: 'WS', name: 'Samoa' },      { code: 'SM', name: 'San Marino' },
  { code: 'ST', name: 'Santo Tomé y Príncipe' }, { code: 'SN', name: 'Senegal' },
  { code: 'RS', name: 'Serbia' },     { code: 'SC', name: 'Seychelles' },
  { code: 'SL', name: 'Sierra Leona' }, { code: 'SG', name: 'Singapur' },
  { code: 'SY', name: 'Siria' },      { code: 'SO', name: 'Somalia' },
  { code: 'LK', name: 'Sri Lanka' },  { code: 'SZ', name: 'Suazilandia' },
  { code: 'ZA', name: 'Sudáfrica' },  { code: 'SD', name: 'Sudán' },
  { code: 'SS', name: 'Sudán del Sur' }, { code: 'SE', name: 'Suecia' },
  { code: 'CH', name: 'Suiza' },      { code: 'SR', name: 'Surinam' },
  { code: 'TH', name: 'Tailandia' },  { code: 'TZ', name: 'Tanzania' },
  { code: 'TJ', name: 'Tayikistán' }, { code: 'TL', name: 'Timor Oriental' },
  { code: 'TG', name: 'Togo' },       { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad y Tobago' }, { code: 'TN', name: 'Túnez' },
  { code: 'TM', name: 'Turkmenistán' }, { code: 'TR', name: 'Turquía' },
  { code: 'TV', name: 'Tuvalu' },     { code: 'UA', name: 'Ucrania' },
  { code: 'UG', name: 'Uganda' },     { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Uzbekistán' }, { code: 'VU', name: 'Vanuatu' },
  { code: 'VE', name: 'Venezuela' },  { code: 'VN', name: 'Vietnam' },
  { code: 'YE', name: 'Yemen' },      { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabue' },
];

const flag = (code) =>
  code.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');

const PLAYERS = [
  { value: 'Lamine Yamal',      label: '🇪🇸 Lamine Yamal — España'    },
  { value: 'Kylian Mbappé',     label: '🇫🇷 Kylian Mbappé — Francia'  },
  { value: 'Cristiano Ronaldo', label: '🇵🇹 Cristiano Ronaldo — Portugal' },
  { value: 'Lionel Messi',      label: '🇦🇷 Lionel Messi — Argentina' },
];

const PerfilScreen = ({ onLogout }) => {
  const [user,        setUser]        = useState(null);
  const [form,        setForm]        = useState({});
  const [selecciones, setSelecciones] = useState([]);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  useEffect(() => {
    Promise.all([getUser(), getSelecciones()]).then(([u, sels]) => {
      setUser(u);
      setForm({ ...u, seleccion_favorita: u?.seleccion_favorita ?? '' });
      setSelecciones(sels);
    });
  }, []);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    const updated = await updateUser(form);
    setUser(updated);
    setForm({ ...updated, seleccion_favorita: updated?.seleccion_favorita ?? '' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) {
    return <div className="flex items-center justify-center h-full text-gray-400">Cargando...</div>;
  }

  const grouped = selecciones.reduce((acc, s) => {
    const g = `Grupo ${s.grupo}`;
    (acc[g] ??= []).push(s);
    return acc;
  }, {});

  const currentFlag = form.pais
    ? flag(COUNTRIES.find(c => c.name === form.pais)?.code ?? '') || '🌐'
    : '🌐';

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Mi Perfil</h1>

      <div className="flex flex-col items-center py-6 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-3xl font-bold mb-2">
          {(user.name?.[0] ?? '?').toUpperCase()}
        </div>
        <p className="font-semibold text-gray-800">{user.name}</p>
        <p className="text-gray-400 text-sm">{user.email}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        <Field label="Nombre" name="name"  value={form.name  ?? ''} onChange={handleChange} />
        <Field label="Email"  name="email" value={form.email ?? ''} onChange={handleChange} type="email" />
        <Field label="Estado" name="estado" value={form.estado ?? ''} onChange={handleChange} />

        {/* País */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">País</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">{currentFlag}</span>
            <select
              name="pais"
              value={form.pais ?? ''}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none bg-white"
            >
              <option value="">Selecciona un país</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.name}>{flag(c.code)} {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Género */}
        <SelectField label="Género" name="genero" value={form.genero ?? ''} onChange={handleChange}>
          <option value="">Selecciona</option>
          <option value="Hombre">Hombre</option>
          <option value="Mujer">Mujer</option>
          <option value="Prefiero no decirlo">Prefiero no decirlo</option>
        </SelectField>

        {/* Selección favorita */}
        <SelectField label="Selección favorita" name="seleccion_favorita" value={form.seleccion_favorita ?? ''} onChange={handleChange}>
          <option value="">— Sin seleccionar —</option>
          {Object.entries(grouped).map(([grupo, sels]) => (
            <optgroup key={grupo} label={grupo}>
              {sels.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </optgroup>
          ))}
        </SelectField>

        {/* Jugador favorito */}
        <SelectField label="Jugador favorito" name="jugador_favorito" value={form.jugador_favorito ?? ''} onChange={handleChange}>
          <option value="">— Sin seleccionar —</option>
          {PLAYERS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </SelectField>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-colors bg-blue-600 active:bg-blue-700 disabled:opacity-50"
        >
          {saved ? '¡Guardado!' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      <button
        onClick={onLogout}
        className="w-full py-2.5 rounded-xl text-red-500 font-semibold text-sm border border-red-200 bg-white active:bg-red-50 transition-colors"
      >
        Cerrar sesión
      </button>
    </div>
  );
};

const Field = ({ label, name, value, onChange, type = 'text' }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none bg-white"
    >
      {children}
    </select>
  </div>
);

export default PerfilScreen;
