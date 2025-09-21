'use client';

import { CountryFlag } from './country-flag';

export function FlagTest() {
    const testCountries = [
        { code: 'ARG', name: 'Argentina' },
        { code: 'CHL', name: 'Chile' },
        { code: 'BRA', name: 'Brasil' },
        { code: 'URY', name: 'Uruguay' },
        { code: 'COL', name: 'Colombia' },
        { code: 'PER', name: 'Perú' },
        { code: 'MEX', name: 'México' },
        { code: 'JPN', name: 'Japón' },
        { code: 'DEU', name: 'Alemania' },
        { code: 'ESP', name: 'España' },
        { code: 'FRA', name: 'Francia' },
        { code: 'ITA', name: 'Italia' },
        { code: 'USA', name: 'Estados Unidos' },
        { code: 'CHN', name: 'China' },
    ];

    return (
        <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Test de Banderas</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {testCountries.map((country) => (
                    <div key={country.code} className="flex items-center gap-2 p-2 border rounded">
                        <CountryFlag
                            countryCode={country.code}
                            countryName={country.name}
                            size="md"
                        />
                        <div>
                            <div className="font-semibold">{country.name}</div>
                            <div className="text-sm text-gray-500">{country.code}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Test de Códigos de 2 letras</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                        { code: 'AR', name: 'Argentina' },
                        { code: 'CL', name: 'Chile' },
                        { code: 'BR', name: 'Brasil' },
                        { code: 'UY', name: 'Uruguay' },
                        { code: 'CO', name: 'Colombia' },
                        { code: 'PE', name: 'Perú' },
                        { code: 'MX', name: 'México' },
                        { code: 'JP', name: 'Japón' },
                    ].map((country) => (
                        <div key={country.code} className="flex items-center gap-2 p-2 border rounded">
                            <CountryFlag
                                countryCode={country.code}
                                countryName={country.name}
                                size="md"
                            />
                            <div>
                                <div className="font-semibold">{country.name}</div>
                                <div className="text-sm text-gray-500">{country.code}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
