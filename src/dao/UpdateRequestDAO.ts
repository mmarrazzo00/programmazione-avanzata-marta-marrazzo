import { Transaction } from 'sequelize';
import { UpdateRequest } from '../models/UpdateRequest.js';
import { Op, WhereOptions } from 'sequelize';

/**
 * Definisce i filtri opzionali utilizzabili per la ricerca
 * delle richieste di aggiornamento.
 *
 * Permette di filtrare per intervallo temporale, tipo di data
 * (creazione o ultima modifica) e stato della richiesta.
 */
    export interface UpdateRequestFilters {
    fromDate?: Date;
    toDate?: Date;
    dateType?: 'createdAt' | 'updatedAt';
    status?: string;
}

/**
 * Data Access Object per l'entità UpdateRequest.
 *
 * Centralizza le operazioni di creazione, ricerca e salvataggio
 * delle richieste di aggiornamento dei modelli a griglia.
 *
 * Supporta transazioni, lock e interrogazioni filtrate
 * sulle diverse versioni di un modello.
 */
export class UpdateRequestDAO {

    /**
     * Crea una nuova richiesta di aggiornamento.
     *
     * Memorizza l'utente proponente, la versione del modello,
     * il costo, lo stato e gli eventuali riferimenti
     * a una richiesta padre.
     *
     * @param data - Dati della richiesta da creare.
     * @param transaction - Eventuale transazione Sequelize.
     * @returns La richiesta di aggiornamento creata.
     */
    async create(
        data: {
            userId: number;
            gridModelId: number;
            parentRequestId?: number | null;
            cost: number;
            status: string;
            decidedAt?: Date | null;
        },
        transaction?: Transaction
    ): Promise<UpdateRequest> {
        return UpdateRequest.create(data, { transaction });
    }

    /**
     * Recupera una richiesta di aggiornamento tramite ID.
     *
     * Se richiesto, applica un lock di aggiornamento
     * all'interno della transazione specificata.
     *
     * @returns La richiesta trovata oppure null.
     */
    async findById(
        id: number,
        transaction?: Transaction,
        lock = false
    ): Promise<UpdateRequest | null> {
        return UpdateRequest.findByPk(id, {
            transaction,

            // Applica il lock soltanto se esiste una transazione.
            ...(lock && transaction
                ? { lock: transaction.LOCK.UPDATE }
                : {})
        });
    }

    /**
     * Recupera una richiesta ancora pending tramite ID.
     *
     * Utilizza un lock di aggiornamento per coordinare
     * eventuali decisioni concorrenti sulla stessa richiesta.
     *
     * @param id - Identificativo della richiesta.
     * @param transaction - Transazione Sequelize obbligatoria.
     * @returns La richiesta pending oppure null.
     */
    async findPendingById(
        id: number,
        transaction: Transaction
    ): Promise<UpdateRequest | null> {
        return UpdateRequest.findOne({
            where: {
                id,
                status: 'pending'
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });
    }

    /**
     * Salva le modifiche apportate a una richiesta.
     *
     * Supporta il salvataggio all'interno di una transazione.
     */
    async save(
        request: UpdateRequest,
        transaction?: Transaction
    ): Promise<void> {
        await request.save({ transaction });
    }

    /**
     * Recupera le richieste associate alle versioni indicate,
     * applicando eventuali filtri per stato e intervallo temporale.
     *
     * Le richieste vengono ordinate dalla più recente
     * alla meno recente in base al tipo di data selezionato.
     *
     * @param versionIds - Identificativi delle versioni del modello.
     * @param filters - Filtri opzionali di ricerca.
     * @returns L'elenco delle richieste corrispondenti.
     */
    async findByVersionIds(
        versionIds: number[],
        filters: UpdateRequestFilters = {}
    ): Promise<UpdateRequest[]> {

        // Limita la ricerca alle versioni specificate.
        const where: WhereOptions = {
            gridModelId: { [Op.in]: versionIds }
        };

        // Aggiunge il filtro sullo stato, se presente.
        if (filters.status) {
            Object.assign(where, { status: filters.status });
        }

        // Costruisce il filtro temporale, se richiesto.
        if (filters.fromDate || filters.toDate) {
            const dateFilter: Record<symbol, Date> = {};

            // Imposta il limite inferiore dell'intervallo.
            if (filters.fromDate) {
                dateFilter[Op.gte] = filters.fromDate;
            }

            // Imposta il limite superiore dell'intervallo.
            if (filters.toDate) {
                dateFilter[Op.lte] = filters.toDate;
            }

            // Applica il filtro a createdAt o updatedAt.
            // In assenza di una scelta esplicita, usa createdAt.
            Object.assign(where, {
                [filters.dateType ?? 'createdAt']: dateFilter
            });
        }

        // Ordina le richieste in ordine cronologico decrescente.
        return UpdateRequest.findAll({
            where,
            order: [[filters.dateType ?? 'createdAt', 'DESC']]
        });
    }

    /**
     * Recupera le richieste pending associate alle versioni indicate.
     *
     * Se summaryOnly è true, seleziona soltanto gli attributi
     * necessari a una rappresentazione sintetica delle richieste.
     *
     * @param versionIds - Identificativi delle versioni del modello.
     * @param summaryOnly - Indica se recuperare soltanto i campi essenziali.
     * @returns Le richieste pending ordinate per data di creazione.
     */
    async findPendingByVersionIds(
        versionIds: number[],
        summaryOnly = false
    ): Promise<UpdateRequest[]> {
        return UpdateRequest.findAll({
            where: {
                gridModelId: { [Op.in]: versionIds },
                status: 'pending'
            },

            // Se richiesto, limita i campi restituiti dalla query.
            ...(summaryOnly
                ? {
                    attributes: [
                        'id',
                        'userId',
                        'gridModelId',
                        'status',
                        'createdAt'
                    ]
                }
                : {}),

            // Mostra prima le richieste pending più recenti.
            order: [['createdAt', 'DESC']]
        });
    }
}