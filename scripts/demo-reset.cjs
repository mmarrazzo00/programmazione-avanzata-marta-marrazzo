
const { spawnSync } = require("node:child_process");

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

// Protezione contro esecuzioni involontarie
if (!process.argv.includes("--confirm")) {
    console.error(
        "ATTENZIONE: il comando elimina tutti i dati del database demo."
    );
    console.error("Per confermare: npm run demo:reset -- --confirm");
    process.exit(1);
}

console.log("1/2 - Pulizia del database PostgreSQL...");

const sql = `
TRUNCATE TABLE
    "execution",
    "update",
    "update_request",
    "grid_model",
    "user"
RESTART IDENTITY CASCADE;
`;

execute("docker", [
    "compose", "exec", "-T", "db",
    "sh", "-c",
    'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "$1"',
    "sh", sql
]);

console.log("2/2 - Rigenerazione dei dati iniziali...");

execute("docker", [
    "compose", "exec", "-T", "app",
    "npm", "run", "seed"
]);

console.log("Database demo ripristinato correttamente!");
