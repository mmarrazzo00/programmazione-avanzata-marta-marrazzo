import { Transaction } from 'sequelize';
import { GridModel } from '../models/GridModel.js';

/**
 * Data Access Object per l'entità GridModel.
 *
 * Centralizza le operazioni di creazione, ricerca e salvataggio
 * delle matrici attraverso Sequelize.
 *
 * Supporta la gestione delle versioni e l'utilizzo
 * di transazioni nelle operazioni sul database.
 */
export class GridModelDAO {

    /**
     * Crea un nuovo record GridModel.
     *
     * I dati comprendono identificativo logico, proprietario,
     * dimensioni, matrice, versione e stato di validità.
     *
     * @param data - Dati della matrice da creare.
     * @param transaction - Eventuale transazione Sequelize.
     * @returns La matrice creata.
     */
    async create(
        data: {
            modelId: string;
            name: string;
            ownerId: number;
            rows: number;
            columns: number;
            matrix: number[][];
            version: number;
            valid: boolean;
        },
        transaction?: Transaction
    ): Promise<GridModel> {
        return GridModel.create(data, { transaction });
    }

    /**
     * Ricerca la versione attualmente valida di una matrice
     * tramite il suo identificativo logico.
     *
     * @returns La matrice valida trovata oppure null.
     */
    async findValidByModelId(
        modelId: string,
        transaction?: Transaction
    ): Promise<GridModel | null> {
        return GridModel.findOne({
            where: {
                modelId,
                valid: true
            },
            transaction
        });
    }

    /**
     * Recupera una matrice tramite la chiave primaria del database.
     *
     * Se lock è true e viene fornita una transazione,
     * richiede un lock di aggiornamento sul record selezionato.
     * Questo permette di coordinare modifiche concorrenti.
     *
     * @param id - Identificativo del record GridModel.
     * @param transaction - Eventuale transazione Sequelize.
     * @param lock - Indica se richiedere un lock di aggiornamento.
     * @returns La matrice trovata oppure null.
     */
    async findById(
        id: number,
        transaction?: Transaction,
        lock = false
    ): Promise<GridModel | null> {
        return GridModel.findByPk(id, {
            transaction,
            ...(lock && transaction
                ? { lock: transaction.LOCK.UPDATE }
                : {})
        });
    }

    /**
     * Salva le modifiche apportate a un'istanza GridModel.
     *
     * Supporta il salvataggio all'interno di una transazione.
     */
    async save(
        model: GridModel,
        transaction?: Transaction
    ): Promise<void> {
        await model.save({ transaction });
    }

    /**
     * Recupera gli identificativi dei record relativi
     * alle diverse versioni di una stessa matrice.
     *
     * La query seleziona esclusivamente il campo id.
     */
    async findVersionsByModelId(modelId: string): Promise<GridModel[]> {
        return GridModel.findAll({
            where: { modelId },
            attributes: ['id']
        });
    }

    /**
     * Recupera le matrici appartenenti a un determinato utente.
     *
     * La query seleziona soltanto identificativo, modelId,
     * nome e versione, senza caricare l'intera matrice.
     */
    async findOwnedByUserId(userId: number): Promise<GridModel[]> {
        return GridModel.findAll({
            where: { ownerId: userId },
            attributes: ['id', 'modelId', 'name', 'version']
        });
    }
}
