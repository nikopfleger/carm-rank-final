'use client';

import { cn } from '@/lib/utils';
import ReactCountryFlag from 'react-country-flag';

interface CountryFlagProps {
  countryCode: string;
  countryName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Componente para mostrar banderas de países
 * Usa react-country-flag que internamente usa FlagCDN
 */
export function CountryFlag({
  countryCode,
  countryName,
  size = 'md',
  className
}: CountryFlagProps) {
  // Mapeo de nombres de países a códigos ISO
  const countryCodeMap: { [key: string]: string } = {
    'Argentina': 'AR',
    'Brasil': 'BR',
    'Brazil': 'BR',
    'Chile': 'CL',
    'Colombia': 'CO',
    'México': 'MX',
    'Mexico': 'MX',
    'Perú': 'PE',
    'Peru': 'PE',
    'Uruguay': 'UY',
    'Paraguay': 'PY',
    'Bolivia': 'BO',
    'Ecuador': 'EC',
    'Venezuela': 'VE',
    'Estados Unidos': 'US',
    'United States': 'US',
    'USA': 'US',
    'Canadá': 'CA',
    'Canada': 'CA',
    'España': 'ES',
    'Spain': 'ES',
    'Francia': 'FR',
    'France': 'FR',
    'Italia': 'IT',
    'Italy': 'IT',
    'Alemania': 'DE',
    'Germany': 'DE',
    'Reino Unido': 'GB',
    'United Kingdom': 'GB',
    'UK': 'GB',
    'Japón': 'JP',
    'Japan': 'JP',
    'China': 'CN',
    'Corea del Sur': 'KR',
    'South Korea': 'KR',
    'Australia': 'AU',
    'Nueva Zelanda': 'NZ',
    'New Zealand': 'NZ',
    'Rusia': 'RU',
    'Russia': 'RU',
    'India': 'IN',
    'Portugal': 'PT',
    'Países Bajos': 'NL',
    'Netherlands': 'NL',
    'Bélgica': 'BE',
    'Belgium': 'BE',
    'Suiza': 'CH',
    'Switzerland': 'CH',
    'Austria': 'AT',
    'Suecia': 'SE',
    'Sweden': 'SE',
    'Noruega': 'NO',
    'Norway': 'NO',
    'Dinamarca': 'DK',
    'Denmark': 'DK',
    'Finlandia': 'FI',
    'Finland': 'FI',
    'Polonia': 'PL',
    'Poland': 'PL',
    'República Checa': 'CZ',
    'Czech Republic': 'CZ',
    'Hungría': 'HU',
    'Hungary': 'HU',
    'Grecia': 'GR',
    'Greece': 'GR',
    'Turquía': 'TR',
    'Turkey': 'TR',
    'Israel': 'IL',
    'Egipto': 'EG',
    'Egypt': 'EG',
    'Sudáfrica': 'ZA',
    'South Africa': 'ZA',
    'Nigeria': 'NG',
    'Kenia': 'KE',
    'Kenya': 'KE',
    'Marruecos': 'MA',
    'Morocco': 'MA',
    'Túnez': 'TN',
    'Tunisia': 'TN',
    'Argelia': 'DZ',
    'Algeria': 'DZ',
    'Libia': 'LY',
    'Libya': 'LY',
    'Etiopía': 'ET',
    'Ethiopia': 'ET',
    'Ghana': 'GH',
    'Costa de Marfil': 'CI',
    'Ivory Coast': 'CI',
    'Senegal': 'SN',
    'Mali': 'ML',
    'Burkina Faso': 'BF',
    'Níger': 'NE',
    'Niger': 'NE',
    'Chad': 'TD',
    'Camerún': 'CM',
    'Cameroon': 'CM',
    'República Centroafricana': 'CF',
    'Central African Republic': 'CF',
    'República Democrática del Congo': 'CD',
    'Democratic Republic of the Congo': 'CD',
    'Congo': 'CG',
    'Gabón': 'GA',
    'Gabon': 'GA',
    'Guinea Ecuatorial': 'GQ',
    'Equatorial Guinea': 'GQ',
    'Santo Tomé y Príncipe': 'ST',
    'São Tomé and Príncipe': 'ST',
    'Angola': 'AO',
    'Zambia': 'ZM',
    'Zimbabue': 'ZW',
    'Zimbabwe': 'ZW',
    'Botsuana': 'BW',
    'Botswana': 'BW',
    'Namibia': 'NA',
    'Lesoto': 'LS',
    'Lesotho': 'LS',
    'Suazilandia': 'SZ',
    'Eswatini': 'SZ',
    'Madagascar': 'MG',
    'Mauricio': 'MU',
    'Mauritius': 'MU',
    'Seychelles': 'SC',
    'Comoras': 'KM',
    'Comoros': 'KM',
    'Yibuti': 'DJ',
    'Djibouti': 'DJ',
    'Somalia': 'SO',
    'Eritrea': 'ER',
    'Sudán': 'SD',
    'Sudan': 'SD',
    'Sudán del Sur': 'SS',
    'South Sudan': 'SS'
  };

  // Determinar el código del país
  const getCountryCode = (): string => {
    // Si ya es un código ISO de 2 letras, usarlo directamente
    if (countryCode && countryCode.length === 2) {
      return countryCode.toUpperCase();
    }

    // Si es un código de 3 letras, convertirlo a 2 letras
    if (countryCode && countryCode.length === 3) {
      const threeToTwoMap: { [key: string]: string } = {
        'ARG': 'AR',
        'BRA': 'BR',
        'CHL': 'CL',
        'COL': 'CO',
        'MEX': 'MX',
        'PER': 'PE',
        'URY': 'UY',
        'PRY': 'PY',
        'BOL': 'BO',
        'ECU': 'EC',
        'VEN': 'VE',
        'USA': 'US',
        'CAN': 'CA',
        'ESP': 'ES',
        'FRA': 'FR',
        'ITA': 'IT',
        'DEU': 'DE',
        'GBR': 'GB',
        'JPN': 'JP',
        'CHN': 'CN',
        'KOR': 'KR',
        'AUS': 'AU',
        'NZL': 'NZ',
        'RUS': 'RU',
        'IND': 'IN',
        'PRT': 'PT',
        'NLD': 'NL',
        'BEL': 'BE',
        'CHE': 'CH',
        'AUT': 'AT',
        'SWE': 'SE',
        'NOR': 'NO',
        'DNK': 'DK',
        'FIN': 'FI',
        'POL': 'PL',
        'CZE': 'CZ',
        'HUN': 'HU',
        'GRC': 'GR',
        'TUR': 'TR',
        'ISR': 'IL',
        'EGY': 'EG',
        'ZAF': 'ZA',
        'NGA': 'NG',
        'KEN': 'KE',
        'MAR': 'MA',
        'TUN': 'TN',
        'DZA': 'DZ',
        'LBY': 'LY',
        'ETH': 'ET',
        'GHA': 'GH',
        'CIV': 'CI',
        'SEN': 'SN',
        'MLI': 'ML',
        'BFA': 'BF',
        'NER': 'NE',
        'TCD': 'TD',
        'CMR': 'CM',
        'CAF': 'CF',
        'COD': 'CD',
        'COG': 'CG',
        'GAB': 'GA',
        'GNQ': 'GQ',
        'STP': 'ST',
        'AGO': 'AO',
        'ZMB': 'ZM',
        'ZWE': 'ZW',
        'BWA': 'BW',
        'NAM': 'NA',
        'LSO': 'LS',
        'SWZ': 'SZ',
        'MDG': 'MG',
        'MUS': 'MU',
        'SYC': 'SC',
        'COM': 'KM',
        'DJI': 'DJ',
        'SOM': 'SO',
        'ERI': 'ER',
        'SDN': 'SD',
        'SSD': 'SS'
      };

      const twoLetterCode = threeToTwoMap[countryCode.toUpperCase()];
      if (twoLetterCode) {
        return twoLetterCode;
      }
    }

    // Buscar en el mapeo por nombre
    const mappedCode = countryCodeMap[countryCode];
    if (mappedCode) {
      return mappedCode;
    }

    // Si no se encuentra, devolver el código original
    return countryCode;
  };

  const isoCode = getCountryCode();

  // Tamaños
  const sizeClasses = {
    sm: 'w-4 h-3',
    md: 'w-6 h-4',
    lg: 'w-8 h-6'
  };

  return (
    <div className={cn("inline-flex items-center", className)}>
      <ReactCountryFlag
        countryCode={isoCode}
        svg
        style={{
          width: size === 'sm' ? '16px' : size === 'md' ? '24px' : '32px',
          height: size === 'sm' ? '12px' : size === 'md' ? '18px' : '24px',
        }}
        title={countryName || countryCode}
      />
    </div>
  );
}
