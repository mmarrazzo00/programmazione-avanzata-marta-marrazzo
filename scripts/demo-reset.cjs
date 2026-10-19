const { spawnSync } = require("node:child_process");

/**
 * Esegue un comando esterno in maniera sincrona.
 *
 * Mostra l'output direttamente nel terminale e interrompe
 * lo script se il comando fallisce o termina con un codice
 * di uscita diverso da zero.
 *
 * @param command - Comando da eseguire.
 * @param args - Argomenti da passare al comando.
 */
function execute(command, args) {
    const result = spawnSync(command, args, {
        stdio: "inherit",
        shell: false
    });

    if (result.error || result.status !== 0) {
        console.error("Operazione interrotta:", result.error?.message || result.status);
        process.exit(1);
    }
}

// Richiede una conferma esplicita per evitare
// la cancellazione accidentale dei dati.
if (!process.argv.includes("--confirm")) {
    console.error(
        "ATTENZIONE: il comando elimina tutti i dati del database demo."
    );
    console.error("Per confermare: npm run demo:reset -- --confirm");
    process.exit(1);
}

console.log("1/2 - Pulizia del database PostgreSQL...");

// Elimina i record delle tabelle indicate,
// azzera le sequenze degli identificativi e gestisce
// le dipendenze tramite CASCADE.
const sql = `
TRUNCATE TABLE
    "execution",
    "update",
    "update_request",
    "grid_model",
    "user"
RESTART IDENTITY CASCADE;
`;

// Esegue il comando SQL nel container PostgreSQL di Docker Compose.
execute("docker", [
    "compose", "exec", "-T", "db",
    "sh", "-c",
    'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "$1"',
    "sh", sql
]);

console.log("2/2 - Rigenerazione dei dati iniziali...");

// Esegue lo script di seed nel container dell'applicazione,
// ricreando gli utenti e i modelli dimostrativi.
execute("docker", [
    "compose", "exec", "-T", "app",
    "npm", "run", "seed"
]);

console.log("Database demo ripristinato correttamente!");
