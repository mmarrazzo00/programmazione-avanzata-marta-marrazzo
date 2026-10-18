import { Transaction } from 'sequelize';
import { User } from '../models/User.js';

/**
 * Data Access Object per l'entità User.
 *
 * Centralizza le operazioni di persistenza degli utenti
 * attraverso il modello Sequelize, separando l'accesso
 * al database dalla logica applicativa.
 */
export class UserDAO {

    /**
     * Crea un nuovo utente nel database.
     *
     * @param data - Dati del nuovo utente.
     * @returns L'istanza dell'utente creato.
     */
    async create(data: {
        username: string;
        email: string;
        password: string;
        role?: string;
    }): Promise<User> {
        return User.create(data);
    }

    /**
     * Ricerca un utente tramite identificativo.
     *
     * @param userId - Identificativo dell'utente.
     * @param transaction - Eventuale transazione Sequelize.
     * @returns L'utente trovato oppure null.
     */
    async findById(
        userId: number,
        transaction?: Transaction
    ): Promise<User | null> {
        return User.findByPk(userId, { transaction });
    }

    /**
     * Salva le modifiche apportate a un'istanza User.
     * Supporta l'esecuzione all'interno di una transazione.
     */
    async save(
        user: User,
        transaction?: Transaction
    ): Promise<void> {
        await user.save({ transaction });
    }

    /**
     * Ricerca un utente tramite indirizzo email.
     *
     * @returns L'utente trovato oppure null.
     */
    async findByEmail(email: string): Promise<User | null> {
        return User.findOne({
            where: { email }
        });
    }

    /**
     * Recupera tutti gli utenti presenti nel database.
     */
    async findAll(): Promise<User[]> {
        return User.findAll();
    }

    /**
     * Aggiorna i dati di un utente identificato tramite ID.
     *
     * Partial consente di specificare soltanto i campi
     * che devono essere modificati.
     *
     * @returns Il numero di record aggiornati e le relative istanze.
     */
    async update(
        id: number,
        data: Partial<{
            username: string;
            email: string;
            password: string;
            role: string;
        }>
    ): Promise<[number, User[]]> {
        return User.update(data, {
            where: { id },
            returning: true
        });
    }

    /**
     * Elimina un utente tramite identificativo.
     *
     * @returns Il numero di record eliminati.
     */
    async delete(id: number): Promise<number> {
        return User.destroy({
            where: { id }
        });
    }

    /**
     * Modifica il saldo dei crediti di un utente.
     *
     * Ricerca l'utente tramite email e somma il valore
     * ricevuto al credito attualmente disponibile.
     * Un valore negativo comporta una diminuzione del saldo.
     *
     * @returns L'utente aggiornato oppure null se non esiste.
     */
    async updateCredit(
        email: string,
        credit: number
    ): Promise<User | null> {
        // Recupera l'utente a cui modificare il credito.
        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            return null;
        }

        // Calcola il nuovo saldo partendo dal credito corrente.
        const currentCredit = Number(user.credit);
        user.credit = currentCredit + credit;

        // Salva il nuovo saldo nel database.
        await user.save();

        return user;
    }
}
