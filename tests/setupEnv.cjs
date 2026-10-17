
/**
 * Ambiente isolato per i test.
 *
 * Sequelize necessita di questi parametri
 * durante l'inizializzazione, ma i DAO
 * saranno simulati tramite mock Jest.
 */

process.env.DB_NAME = 'pathfinding_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASS = 'test_password';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
