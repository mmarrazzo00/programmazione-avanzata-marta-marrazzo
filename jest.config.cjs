
/**
 * Configurazione Jest per il progetto TypeScript.
 * SWC trasforma TypeScript in JavaScript durante i test.
 */

module.exports = {
    testEnvironment: 'node',

    testMatch: ['**/tests/**/*.test.ts'],

    transform: {
        '^.+\\.tsx?$': [
            '@swc/jest',
            {
                jsc: {
                    parser: {
                        syntax: 'typescript'
                    },
                    target: 'es2022'
                },
                module: {
                    type: 'commonjs'
                }
            }
        ]
    },

    // Gestisce gli import TypeScript con estensione .js
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },

    // Variabili necessarie per istanziare Sequelize
    // senza effettuare connessioni reali.
    setupFiles: ['<rootDir>/tests/setupEnv.cjs'],

    clearMocks: true,
    restoreMocks: true,

    collectCoverageFrom: [
        'src/services/**/*.ts',
        '!src/services/**/*.d.ts'
    ],

    coverageDirectory: 'coverage'
};
