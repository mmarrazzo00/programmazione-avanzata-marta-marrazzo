
import { Transaction } from 'sequelize';
import { Update } from '../models/Update.js';

/**
 * Data Access Object per l'entità Update.
 *
 * Centralizza le operazioni di persistenza delle modifiche
 * alle singole celle delle matrici.
 *
 * Supporta operazioni multiple, transazioni e lock
 * per la gestione delle modifiche concorrenti.
 */
export class UpdateDAO {

    /**
     * Registra una singola modifica associata
     * a una richiesta di aggiornamento.
     *
     * Memorizza le coordinate della cella, il valore
     * precedente e il nuovo valore proposto.
     *
     * @param data - Dati della modifica da creare.
     * @param transaction - Eventuale transazione Sequelize.
     * @returns La modifica creata.
     */
    async create(
        data: {
            updateRequestId: number;
            row: number;
            column: number;
            oldValue: number;
            newValue: number;
        },
        transaction?: Transaction
    ): Promise<Update> {
        return Update.create(data, { transaction });
    }

    /**
     * Registra più modifiche con un'unica operazione bulk.
     *
     * Il metodo è utile quando una richiesta di aggiornamento
     * coinvolge più celle della matrice.
     *
     * @param updates - Elenco delle modifiche da inserire.
     * @param transaction - Eventuale transazione Sequelize.
     * @returns Le modifiche create.
     */
    async createMany(
        updates: {
            updateRequestId: number;
            row: number;
            column: number;
            oldValue: number;
            newValue: number;
        }[],
        transaction?: Transaction
    ): Promise<Update[]> {
        return Update.bulkCreate(updates, { transaction });
    }

    /**
     * Recupera le modifiche associate a una richiesta di aggiornamento.
     *
     * Consente di specificare una transazione, richiedere
     * un lock di aggiornamento e selezionare soltanto
     * determinati attributi del modello.
     *
     * @param requestId - Identificativo della richiesta di aggiornamento.
     * @param transaction - Eventuale transazione Sequelize.
     * @param lock - Indica se richiedere un lock di aggiornamento.
     * @param attributes - Eventuali attributi da recuperare.
     * @returns L'elenco delle modifiche associate alla richiesta.
     */
    async findByRequestId(
        requestId: number,
        transaction?: Transaction,
        lock = false,
        attributes?: string[]
    ): Promise<Update[]> {
        return Update.findAll({
            where: { updateRequestId: requestId },

            // Limita gli attributi restituiti, se specificati.
            ...(attributes ? { attributes } : {}),

            transaction,

            // Applica il lock soltanto in presenza di una transazione.
            ...(lock && transaction
                ? { lock: transaction.LOCK.UPDATE }
                : {})
        });
    }

}
