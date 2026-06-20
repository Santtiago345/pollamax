export interface Country {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  { code: 'BRA', name: 'Brasil', flag: '🇧🇷' },
  { code: 'FRA', name: 'Francia', flag: '🇫🇷' },
  { code: 'ESP', name: 'España', flag: '🇪🇸' },
  { code: 'GER', name: 'Alemania', flag: '🇩🇪' },
  { code: 'ENG', name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'ITA', name: 'Italia', flag: '🇮🇹' },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹' },
  { code: 'NED', name: 'Países Bajos', flag: '🇳🇱' },
  { code: 'URU', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴' },
  { code: 'BEL', name: 'Bélgica', flag: '🇧🇪' },
  { code: 'CRO', name: 'Croacia', flag: '🇭🇷' },
  { code: 'MAR', name: 'Marruecos', flag: '🇲🇦' },
  { code: 'MEX', name: 'México', flag: '🇲🇽' },
  { code: 'USA', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'CAN', name: 'Canadá', flag: '🇨🇦' },
  { code: 'ECU', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'SEN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'JPN', name: 'Japón', flag: '🇯🇵' },
  { code: 'KOR', name: 'Corea del Sur', flag: '🇰🇷' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
  { code: 'SUI', name: 'Suiza', flag: '🇨🇭' },
  { code: 'DEN', name: 'Dinamarca', flag: '🇩🇰' },
  { code: 'SWE', name: 'Suecia', flag: '🇸🇪' },
  { code: 'CHL', name: 'Chile', flag: '🇨🇱' },
  { code: 'PER', name: 'Perú', flag: '🇵🇪' },
  { code: 'PAR', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'VEN', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'CRC', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'KSA', name: 'Arabia Saudita', flag: '🇸🇦' },
  { code: 'EGY', name: 'Egipto', flag: '🇪🇬' }
];

export function getFlagByCountryName(name: string): string {
  const country = COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase());
  return country ? country.flag : '🏳️';
}

export function getFlagByCountryCode(code: string): string {
  const country = COUNTRIES.find(c => c.code.toUpperCase() === code.toUpperCase());
  return country ? country.flag : '🏳️';
}
