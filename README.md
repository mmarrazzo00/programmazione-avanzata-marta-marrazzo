# Pathfinding API – Progetto di Programmazione Avanzata

**Autore:** Marta Marrazzo  
**Progetto universitario:** Programmazione Avanzata  
**Linguaggio:** TypeScript  
**Architettura:** Backend REST API

---

## 1. Descrizione del progetto

Pathfinding API è un'applicazione backend REST sviluppata in TypeScript per la gestione di modelli a griglia bidimensionale, il loro versionamento e l'esecuzione dell'algoritmo di ricerca del percorso A* (A-star).

Il sistema consente agli utenti autenticati di creare modelli, modificarne le celle, proporre aggiornamenti a modelli appartenenti ad altri utenti e gestire le relative richieste di approvazione.

L'applicazione comprende inoltre un sistema di crediti, funzionalità di analisi storica, controlli di autorizzazione e strumenti per l'esecuzione di test automatici.

Le principali funzionalità sono:

- Autenticazione tramite JWT con firma RS256.
- Gestione di utenti normali e amministratori.
- Creazione e validazione di modelli a griglia.
- Versionamento dei modelli.
- Aggiornamento diretto da parte del proprietario.
- Richieste di aggiornamento da parte di altri utenti.
- Approvazione, rigetto e accettazione parziale delle modifiche.
- Gestione dei crediti associati agli aggiornamenti.
- Consultazione dello storico con filtri temporali e per stato.
- Esecuzione dell'algoritmo A*.
- Persistenza dei dati su PostgreSQL.
- Test automatici con Jest e Postman/Newman.

## 2. Tecnologie utilizzate

| Tecnologia | Utilizzo |
|---|---|
| Node.js | Ambiente di esecuzione |
| TypeScript | Linguaggio di programmazione |
| Express.js | Realizzazione delle API REST |
| PostgreSQL 16 | Database relazionale |
| Sequelize | ORM per la gestione della persistenza |
| bcrypt | Gestione sicura delle password |
| JSON Web Token | Autenticazione tramite token |
| RS256 | Firma e verifica dei token con chiavi RSA |
| express-validator | Validazione delle richieste HTTP |
| astar-typescript | Implementazione dell'algoritmo A* |
| Docker | Containerizzazione |
| Docker Compose | Orchestrazione di backend e database |
| Jest | Test automatici |
| Postman | Test delle API REST |
| Newman | Esecuzione automatizzata della collection Postman |

## 3. Architettura dell'applicazione

L'applicazione adotta un'architettura a livelli, basata sulla separazione delle responsabilità tra gestione delle richieste HTTP, logica applicativa, regole di validazione e persistenza dei dati.

La struttura del progetto è organizzata nei seguenti componenti:

- **Routes:** definiscono gli endpoint REST, associano i metodi HTTP alle operazioni applicative e gestiscono il collegamento con i controller e i middleware.
- **Controllers:** ricevono le richieste HTTP, estraggono i parametri e i dati necessari, richiamano i servizi applicativi e restituiscono le risposte al client.
- **Services:** implementano la logica di business del sistema, coordinando le operazioni relative ai modelli, al versionamento, agli aggiornamenti, ai crediti e all'esecuzione dell'algoritmo A*.
- **ERules:** rappresentano le regole applicative e i controlli di validità utilizzati per verificare il rispetto dei vincoli previsti dal sistema.
- **DAO (Data Access Objects):** incapsulano le operazioni di accesso e persistenza dei dati, separando la logica applicativa dalle interrogazioni al database.
- **Models:** definiscono le entità persistenti e le relative associazioni mediante Sequelize.
- **Middleware:** gestiscono funzionalità trasversali, tra cui autenticazione JWT, autorizzazione e controlli sulle richieste.
- **Seed:** inizializza il database con utenti, modelli, versioni e richieste dimostrative, necessari anche per gli scenari di test.

### Flusso generale di una richiesta

Il flusso applicativo segue, in linea generale, questa sequenza:

**Client HTTP → Routes → Middleware → Controllers → Services → ERules / DAO → Models → PostgreSQL**

Il controller gestisce la comunicazione HTTP, mentre il service coordina la logica applicativa. Le ERules consentono di applicare i vincoli previsti dal sistema; i DAO si occupano invece dell'interazione con i modelli persistenti e con il database.

Questa organizzazione favorisce la modularità, la manutenibilità, il riutilizzo del codice e la testabilità dei singoli componenti.

## 4. Autenticazione e autorizzazione

Il sistema utilizza JSON Web Token (JWT) per proteggere gli endpoint che richiedono autenticazione.

I token vengono firmati tramite algoritmo **RS256**, utilizzando una coppia di chiavi RSA:

- Chiave privata per la firma dei token.
- Chiave pubblica per la verifica dei token.

Le chiavi non vengono incluse nel repository e devono essere generate durante la configurazione dell'ambiente.

### Ruoli applicativi

**Utente normale**

Può creare modelli, eseguirli, proporre aggiornamenti e gestire le richieste relative ai modelli di cui è proprietario.

**Amministratore**

Può eseguire le funzionalità amministrative previste dall'applicazione, tra cui la ricarica del credito degli utenti.

Le decisioni sulle richieste di aggiornamento sono riservate al proprietario del modello interessato.

## 5. Gestione dei modelli a griglia

Ogni modello è identificato da un identificativo logico e contiene una matrice bidimensionale.

I valori della matrice descrivono la configurazione delle celle e vengono utilizzati anche per le operazioni di ricerca del percorso.

Il sistema esegue controlli sulla struttura e sui valori delle matrici, impedendo la creazione di modelli non validi.

Per gli aggiornamenti vengono inoltre verificate:

- La validità delle coordinate.
- L'appartenenza delle coordinate alla griglia.
- La correttezza dei nuovi valori.
- L'assenza di modifiche duplicate nella stessa richiesta.
- La differenza tra il valore corrente della cella e quello proposto.

Il sistema conserva le versioni dei modelli per consentire la consultazione delle modifiche effettuate nel tempo.

## 6. Versionamento e richieste di aggiornamento

La gestione degli aggiornamenti dipende dalla proprietà del modello.

### 6.1 Aggiornamento diretto del proprietario

Quando il proprietario modifica un proprio modello, l'aggiornamento viene applicato direttamente, dopo la verifica dei vincoli applicativi e del credito disponibile.

### 6.2 Richiesta di aggiornamento di un altro utente

Quando un utente diverso dal proprietario propone una modifica, viene creata una richiesta con stato iniziale `pending`.

Il proprietario del modello può successivamente esaminare la richiesta e decidere se accettarla o respingerla.

### 6.3 Approvazione, rigetto e split

Sono previste tre modalità di gestione:

- **Approvazione completa:** vengono accettate tutte le modifiche richieste.
- **Rigetto completo:** vengono respinte tutte le modifiche richieste.
- **Split:** il proprietario decide individualmente quali modifiche accettare e quali respingere.

Le richieste e le decisioni vengono registrate per consentire la successiva consultazione dello storico.

## 7. Sistema di crediti

Il sistema associa un saldo di crediti a ciascun utente.

Il costo previsto per gli aggiornamenti è pari a **0,35 crediti per cella accettata**.

La gestione del credito segue queste regole:

- Gli aggiornamenti diretti del proprietario comportano un addebito immediato.
- Gli utenti non proprietari possono proporre modifiche anche se non dispongono di credito.
- Per le modifiche proposte, il credito viene controllato e addebitato al momento dell'approvazione.
- Le modifiche respinte non comportano un addebito.
- In caso di credito insufficiente, l'operazione che richiede l'addebito non viene completata.
- La ricarica dei crediti è riservata agli amministratori.

L'addebito differito delle modifiche proposte rappresenta una scelta progettuale adottata nell'implementazione: l'utente sostiene il costo quando la modifica viene effettivamente accettata.

## 8. Algoritmo di ricerca A*

L'applicazione integra l'algoritmo di ricerca del percorso **A\*** mediante la libreria `astar-typescript`.

Per avviare un'esecuzione, l'utente specifica:

- La posizione iniziale.
- La posizione di destinazione.
- Il modello sul quale effettuare la ricerca.

Il sistema verifica che le coordinate appartengano alla griglia e che le posizioni siano valide.

Se esiste un percorso raggiungibile, l'applicazione restituisce i dati dell'esecuzione, comprendenti il percorso individuato, il costo e il tempo di elaborazione.

Sono gestiti anche i casi in cui:

- Le coordinate non sono valide.
- Una posizione richiesta è un ostacolo.
- Non esiste un percorso tra partenza e destinazione.

Le informazioni relative alle esecuzioni vengono gestite dal servizio applicativo e possono essere registrate nel database.

## 9. API REST principali

Con la configurazione Docker predefinita, le API sono accessibili all'indirizzo:

`http://localhost:3000`

| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/health` | Verifica dello stato del backend |
| POST | `/login` | Autenticazione dell'utente |
| POST | `/models` | Creazione di un nuovo modello |
| POST | `/models/:modelId` | Aggiornamento o proposta di modifica |
| PATCH | `/update-requests/:requestId/decision` | Approvazione o rigetto completo |
| PATCH | `/update-requests/:requestId/cell-decisions` | Decisioni sulle singole modifiche |
| GET | `/analysis/:modelId/updates` | Consultazione degli aggiornamenti |
| GET | `/analysis/:modelId/status` | Stato delle richieste del modello |
| GET | `/analysis/pending-requests` | Richieste in attesa sui propri modelli |
| POST | `/models/:modelId/execute` | Esecuzione dell'algoritmo A* |
| PATCH | `/users/credit` | Ricarica amministrativa del credito |

Gli endpoint protetti richiedono il token JWT nell'header HTTP:

`Authorization: Bearer <token>`

### 9.1 Esempio di creazione di un modello

**POST `/models`**

```json
{
  "modelId": "example-grid",
  "name": "Example Grid",
  "matrix": [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0]
  ]
}
```

### 9.2 Esempio di proposta di aggiornamento

**POST `/models/example-grid`**

```json
[
  {
    "row": 0,
    "column": 1,
    "newValue": 1
  }
]
```

### 9.3 Esempio di approvazione completa

**PATCH `/update-requests/:requestId/decision`**

```json
{
  "accept": true
}
```

### 9.4 Esempio di esecuzione A*

**POST `/models/astar-demo/execute`**

```json
{
  "start": {
    "row": 0,
    "column": 0
  },
  "goal": {
    "row": 2,
    "column": 2
  }
}
```

## 10. Installazione e avvio con Docker

Il progetto utilizza Docker Compose per avviare il backend Node.js/Express e il database PostgreSQL 16.

### 10.1 Prerequisiti

Per avviare il progetto sono necessari:

- Git.
- Docker Desktop o Docker Engine con Docker Compose.
- OpenSSL per generare le chiavi RSA.

Per eseguire i test Jest e Newman direttamente sulla macchina locale è necessario anche Node.js con npm.

### 10.2 Clonazione del repository

```bash
git clone https://github.com/mmarrazzo00/programmazione-avanzata-marta-marrazzo.git
cd programmazione-avanzata-marta-marrazzo
```

### 10.3 Configurazione delle variabili d'ambiente

Il progetto utilizza un file `.env` per configurare l'ambiente locale.

Il file `.env` non viene incluso nel repository per evitare la pubblicazione di credenziali.

Per configurare l'applicazione, copiare il file  `.env.example`, fornito nel repository, e rinominare la copia in  `.env `.

Su Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Su Linux o macOS:

```bash
cp .env.example .env
```

Le principali variabili utilizzate da Docker Compose sono:

| Variabile | Descrizione |
|---|---|
| `DB_NAME` | Nome del database PostgreSQL |
| `DB_USER` | Utente PostgreSQL |
| `DB_PASS` | Password PostgreSQL |
| `DB_PORT` | Porta PostgreSQL sull'host, predefinita `5432` |
| `APP_PORT` | Porta HTTP sull'host, predefinita `3000` |

Esempio di configurazione locale:

```dotenv
DB_NAME=taskdb
DB_USER=postgres
DB_PASS=change_me_for_local_demo
DB_PORT=5432
APP_PORT=3000
```

È necessario sostituire la password d'esempio con una password scelta per l'ambiente locale.

All'interno di Docker Compose, il backend comunica con PostgreSQL utilizzando il nome del servizio `db` e la porta `5432`.

### 10.4 Generazione delle chiavi RSA

L'autenticazione JWT utilizza due chiavi RSA, una privata e una pubblica.

Creare la cartella `keys` nella directory principale del progetto e generare le chiavi con OpenSSL.

Su Linux o macOS:

```bash
mkdir -p keys
openssl genpkey -algorithm RSA -out keys/private.key -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in keys/private.key -out keys/public.key
```

Su Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force keys

openssl genpkey -algorithm RSA -out keys/private.key -pkeyopt rsa_keygen_bits:2048

openssl rsa -pubout -in keys/private.key -out keys/public.key
```

Docker Compose monta la cartella `keys/` nel container applicativo in modalità sola lettura.

I percorsi utilizzati dal backend nel container sono:

```text
/app/keys/private.key
/app/keys/public.key
```

Le chiavi RSA non devono essere caricate nel repository GitHub.

### 10.5 Avvio dei container

Eseguire:

```bash
docker compose up --build -d
```

Il comando costruisce l'immagine del backend e avvia i due servizi previsti.

PostgreSQL utilizza un volume Docker per conservare i dati tra avvii successivi.

Il servizio backend attende che il database superi il controllo di disponibilità configurato mediante healthcheck.

### 10.6 Inizializzazione del database

Con i container avviati, eseguire:

```bash
docker compose exec app npm run seed
```

Lo script inizializza il database con utenti dimostrativi, modelli, versioni e richieste di aggiornamento.

### 10.7 Verifica dell'avvio

Con le porte predefinite, il backend è raggiungibile all'indirizzo:

`http://localhost:3000`

Per verificare lo stato del servizio:

`GET http://localhost:3000/health`

### 10.8 Arresto dei servizi

```bash
docker compose down
```

Questo comando arresta i container senza eliminare il volume PostgreSQL.

## 11. Dati dimostrativi

Il seed predispone dati utili alla verifica delle principali funzionalità applicative.

### Utenti

| Email | Password dimostrativa | Credito iniziale |
|---|---|---|
| `admin@example.com` | `admin123` | 1000 |
| `user@example.com` | `user123` | 100 |
| `nocredit@example.com` | `nocredit123` | 0 |

Le credenziali sono destinate esclusivamente all'ambiente dimostrativo e non devono essere utilizzate in produzione.

### Modelli disponibili

| Identificativo | Descrizione |
|---|---|
| `demo-simple` | Griglia 5×5 |
| `demo-medium` | Griglia 8×8 |
| `demo-complex` | Griglia 10×10 |
| `astar-demo` | Scenario A* con percorso raggiungibile |
| `astar-blocked` | Scenario A* senza percorso raggiungibile |

I modelli dimostrativi comprendono versioni e richieste di aggiornamento con stati differenti, utili per verificare lo storico, le approvazioni e i filtri temporali.

Lo script di seed ordinario è concepito per inizializzare i dati mancanti e non per cancellare automaticamente tutte le informazioni già presenti nel database.

## 12. Test automatici con Jest

Il progetto utilizza Jest per verificare il funzionamento dei servizi applicativi.

Le verifiche includono test relativi alla gestione dei modelli a griglia e all'esecuzione dell'algoritmo di ricerca del percorso.

### Installazione delle dipendenze

```bash
npm ci
```

### Esecuzione dei test

```bash
npm test
```

### Esecuzione con report di copertura

```bash
npm run test:coverage
```

Il progetto utilizza una configurazione Jest dedicata per l'esecuzione dei test TypeScript.

## 13. Test delle API con Postman e Newman

Il repository contiene una collection Postman per verificare le principali operazioni REST.

I test comprendono scenari positivi e negativi relativi a:

- Autenticazione.
- Creazione dei modelli.
- Validazione degli input.
- Gestione del credito insufficiente.
- Modifiche dirette e richieste `pending`.
- Approvazione completa e rigetto.
- Approvazione parziale tramite split.
- Controlli di autorizzazione.
- Analisi dello storico e applicazione dei filtri.
- Esecuzione dell'algoritmo A*.
- Ricarica amministrativa del credito.

### 13.1 File Postman

La cartella `postman/` contiene:

```text
Programmazione Avanzata.postman_collection.json
New Environment.postman_environment.json
```

Nell' Evvironment è configurata la variabile:

```text
baseUrl = http://localhost:3000
```

La collection comprende richieste di login per ottenere i token degli utenti dimostrativi e utilizzarli nelle successive chiamate protette.

### 13.2 Esecuzione automatica con Newman

Dopo aver avviato il backend e inizializzato il database:

```bash
npm ci
npm run test:postman
```

Il comando esegue la collection utilizzando l'Environment presente nella cartella `postman/`.

### 13.3 Riproducibilità dei test

Le richieste della collection possono modificare lo stato del database, creando modelli, aggiornando celle, gestendo richieste e ricaricando crediti.

Di conseguenza, per ottenere risultati riproducibili è necessario eseguire i test partendo dalla configurazione iniziale prevista dal seed.

Il progetto mette a disposizione il comando:

```bash
npm run demo:reset -- --confirm
```

Lo script di reset svuota le tabelle applicative del database Docker di prova e successivamente esegue il seed.

La procedura consigliata è:

```bash
docker compose up --build -d
npm run demo:reset -- --confirm
npm run test:postman
```

Il reset è un'operazione distruttiva e deve essere utilizzato esclusivamente sul database dimostrativo, senza dati da conservare.

In alternativa, è possibile svuotare manualmente le tabelle PostgreSQL e rieseguire il seed.

## 14. Sicurezza e configurazione

Il progetto adotta alcune misure per separare i dati sensibili dal codice sorgente:

- Le password degli utenti vengono gestite tramite bcrypt.
- Gli endpoint protetti richiedono autenticazione JWT.
- La firma dei token utilizza chiavi RSA.
- Le operazioni amministrative sono soggette a controlli di autorizzazione.
- La gestione delle richieste di aggiornamento rispetta la proprietà dei modelli.
- Le variabili d'ambiente sono separate dal codice.
- I file `.env` e le chiavi RSA sono esclusi dal versionamento Git.

## 15. Autore

**Marta Marrazzo**

Progetto sviluppato per l'esame universitario di **Programmazione Avanzata**.

Repository GitHub: [programmazione-avanzata-marta-marrazzo](https://github.com/mmarrazzo00/programmazione-avanzata-marta-marrazzo).