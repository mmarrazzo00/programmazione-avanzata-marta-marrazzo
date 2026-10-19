import { HttpError } from '../middleware/errorHandler.js';
import { Transaction } from 'sequelize';
import { UserDAO } from '../dao/UserDAO.js';

/**
 * Service responsabile della gestione del consumo dei crediti.
 *
 * Verifica che l'utente esista e disponga di credito
 * sufficiente prima di effettuare l'addebito.
 */
export class CreditService {

    private userDAO = new UserDAO();

    /**
     * Verifica la disponibilità dei crediti e, se sufficiente,
     * sottrae l'importo richiesto dal saldo dell'utente.
     *
     * L'operazione può essere eseguita all'interno
     * di una transazione Sequelize.
     *
     * @param userId - Identificativo dell'utente.
     * @param amount - Quantità di crediti da consumare.
     * @param transaction - Eventuale transazione Sequelize.
     * @throws HttpError 401 se l'utente non esiste
     * o se il credito disponibile è insufficiente.
     */
    async checkAndConsume(
        userId: number,
        amount: number,
        transaction?: Transaction
    ): Promise<void> {

        // Recupera l'utente dal database tramite il DAO.
        const user = await this.userDAO.findById(userId, transaction);

        if (!user) {
            throw new HttpError(401, 'User not found');
        }

        console.log('Current credit:', user.credit, 'Amount to consume:', amount);

        // Converte il saldo in numero per eseguire il confronto e la sottrazione.
        const currentCredit = Number(user.credit);

        // Impedisce l'addebito se il saldo disponibile è insufficiente.
        if (currentCredit < amount) {
            throw new HttpError(401, 'Insufficient credit');
        }

        // Sottrae dal saldo l'importo richiesto.
        user.credit = currentCredit - amount;

        console.log('New credit after consumption:', user.credit);

        // Salva il nuovo saldo, utilizzando l'eventuale transazione.
        await user.save({
            transaction
        });
    }
}
