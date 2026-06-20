export interface Country {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  // CONMEBOL
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  { code: 'BRA', name: 'Brasil', flag: '🇧🇷' },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴' },
  { code: 'ECU', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'PAR', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'URU', name: 'Uruguay', flag: '🇺🇾' },

  // CONCACAF
  { code: 'USA', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'MEX', name: 'México', flag: '🇲🇽' },
  { code: 'CAN', name: 'Canadá', flag: '🇨🇦' },
  { code: 'PAN', name: 'Panamá', flag: '🇵🇦' },
  { code: 'HTI', name: 'Haití', flag: '🇭🇹' },
  { code: 'CUW', name: 'Curazao', flag: '🇨🇼' },

  // UEFA
  { code: 'GER', name: 'Alemania', flag: '🇩🇪' },
  { code: 'AUT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BEL', name: 'Bélgica', flag: '🇧🇪' },
  { code: 'BIH', name: 'Bosnia y Herzegovina', flag: '🇧🇦' },
  { code: 'CRO', name: 'Croacia', flag: '🇭🇷' },
  { code: 'SCO', name: 'Escocia', flag: '🏴' },
  { code: 'ESP', name: 'España', flag: '🇪🇸' },
  { code: 'FRA', name: 'Francia', flag: '🇫🇷' },
  { code: 'ENG', name: 'Inglaterra', flag: '🏴' },
  { code: 'NOR', name: 'Noruega', flag: '🇳🇴' },
  { code: 'NED', name: 'Países Bajos', flag: '🇳🇱' },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹' },
  { code: 'CZE', name: 'República Checa', flag: '🇨🇿' },
  { code: 'SWE', name: 'Suecia', flag: '🇸🇪' },
  { code: 'SUI', name: 'Suiza', flag: '🇨🇭' },
  { code: 'TUR', name: 'Turquía', flag: '🇹🇷' },

  // AFC
  { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
  { code: 'IRN', name: 'Irán', flag: '🇮🇷' },
  { code: 'JPN', name: 'Japón', flag: '🇯🇵' },
  { code: 'JOR', name: 'Jordania', flag: '🇯🇴' },
  { code: 'KOR', name: 'Corea del Sur', flag: '🇰🇷' },
  { code: 'QAT', name: 'Catar', flag: '🇶🇦' },
  { code: 'KSA', name: 'Arabia Saudita', flag: '🇸🇦' },
  { code: 'UZB', name: 'Uzbekistán', flag: '🇺🇿' },
  { code: 'IRQ', name: 'Irak', flag: '🇮🇶' },

  // CAF
  { code: 'ALG', name: 'Argelia', flag: '🇩🇿' },
  { code: 'CPV', name: 'Cabo Verde', flag: '🇨🇻' },
  { code: 'CIV', name: 'Costa de Marfil', flag: '🇨🇮' },
  { code: 'EGY', name: 'Egipto', flag: '🇪🇬' },
  { code: 'GHA', name: 'Ghana', flag: '🇬🇭' },
  { code: 'MAR', name: 'Marruecos', flag: '🇲🇦' },
  { code: 'SEN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'RSA', name: 'Sudáfrica', flag: '🇿🇦' },
  { code: 'TUN', name: 'Túnez', flag: '🇹🇳' },
  { code: 'COD', name: 'RD del Congo', flag: '🇨🇩' },

  // OFC
  { code: 'NZL', name: 'Nueva Zelanda', flag: '🇳🇿' }
];

export function getFlagByCountryName(name: string): string {
  const country = COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase());
  return country ? country.flag : '🏳️';
}

export function getFlagByCountryCode(code: string): string {
  const country = COUNTRIES.find(c => c.code.toUpperCase() === code.toUpperCase());
  return country ? country.flag : '🏳️';
}
