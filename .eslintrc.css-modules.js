module.exports = {
    extends: [
        'next/core-web-vitals',
        'next/typescript'
    ],
    rules: {
        // Reglas para CSS Modules
        'no-restricted-imports': [
            'error',
            {
                patterns: [
                    {
                        group: ['**/*.css'],
                        message: 'Use CSS Modules (.module.css) instead of regular CSS files'
                    }
                ]
            }
        ],

        // Reglas personalizadas para className
        'react/no-unknown-property': [
            'error',
            {
                ignore: ['css']
            }
        ],

        // Prevenir uso de className con strings literales
        'no-restricted-syntax': [
            'error',
            {
                selector: 'Literal[value=/^(bg-|text-|p-|m-|w-|h-|flex|grid)/]',
                message: 'Use CSS Modules instead of Tailwind classes in className'
            }
        ]
    },

    // Configuración para archivos específicos
    overrides: [
        {
            files: ['**/*.tsx', '**/*.jsx'],
            rules: {
                // Reglas específicas para componentes React
                'react/jsx-no-literals': 'off',
                'react/display-name': 'off'
            }
        },
        {
            files: ['**/*.module.css'],
            rules: {
                // Reglas específicas para archivos CSS Modules
                'no-unused-expressions': 'off'
            }
        }
    ]
};
