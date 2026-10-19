import bcrypt from 'bcrypt';
import { UserDAO } from '../dao/UserDAO.js';
import { HttpError } from '../middleware/errorHandler.js';
import { User } from '../models/User.js';

/**
 * Service responsabile della gestione degli utenti.
 *
 * Contiene la logica applicativa per la registrazione,
 * la consultazione, la modifica e l'eliminazione degli utenti,
 * oltre all'aggiornamento dei crediti.
 *
 * Delega le operazioni sul database a UserDAO.
 */
export class UserService {

    private userDAO: UserDAO;

    constructor() {
        this.userDAO = new UserDAO();
    }

    /**
     * Registra un nuovo utente.
     *
     * Verifica l'unicità dell'email e genera l'hash
     * della password prima di salvare l'utente.
     *
     * @throws HttpError 409 se l'email è già utilizzata.
     */
    async createUser(data: {
        username: string;
        email: string;
        password: string;
        role?: string;
    }) {
        // Controlla che non esista già un utente con la stessa email.
        const existingUser = await this.userDAO.findByEmail(data.email);

        if (existingUser) {
            throw new HttpError(409, 'Email already in use');
        }

        // Genera l'hash della password con bcrypt e fattore di costo 10.
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Salva l'utente sostituendo la password con il relativo hash.
        return this.userDAO.create({
            ...data,
            password: hashedPassword
        });
    }

    /**
     * Recupera tutti gli utenti registrati attraverso il DAO.
     */
    async getAllUsers() {
    return this.userDAO.findAll();
}
    
    /**
     * Recupera un utente tramite identificativo.
     *
     * @throws HttpError 404 se l'utente non esiste.
     */
    async getUserById(id: number) {
        const user = await this.userDAO.findById(id);
        if (!user) {
            throw new HttpError(404, 'User not found');
        }
        return user;
    }

    /**
     * Aggiorna i dati di un utente.
     *
     * Verifica l'esistenza dell'utente, controlla l'eventuale
     * modifica dell'email e genera un nuovo hash se viene
     * fornita una password.
     *
     * @throws HttpError 404 se l'utente non esiste.
     * @throws HttpError 409 se la nuova email è già utilizzata.
     */
    async updateUser(
    id: number,
    data: {
        username?: string;
        email?: string;
        password?: string;
        role?: string;
    }
) {
    // Verifica che l'utente da aggiornare esista.
    const user = await this.userDAO.findById(id);

    if (!user) {
        throw new HttpError(404, 'User not found');
    }

    // Controlla l'unicità dell'email soltanto se viene modificata.
    if (data.email && data.email !== user.email) {
        const existingUser = await this.userDAO.findByEmail(data.email);

        if (existingUser) {
            throw new HttpError(409, 'Email already in use');
        }
    }

    // Genera l'hash della nuova password, se specificata.
    if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
    }

    // Delega l'aggiornamento al DAO.
    const [affectedRows, updatedUsers] =
        await this.userDAO.update(id, data);

    if (affectedRows === 0) {
        throw new HttpError(404, 'User not found');
    }

    return updatedUsers[0];
}

    /**
     * Elimina un utente tramite identificativo.
     *
     * @throws HttpError 404 se nessun utente viene eliminato.
     */
async deleteUser(id: number): Promise<void> {
    const deletedRows = await this.userDAO.delete(id);

    if (deletedRows === 0) {
        throw new HttpError(404, 'User not found');
    }
}

    /**
     * Aggiorna il saldo dei crediti di un utente.
     *
     * Il valore ricevuto viene sommato al saldo esistente
     * attraverso UserDAO.
     *
     * @param email - Email dell'utente.
     * @param credit - Quantità di crediti da aggiungere.
     * @returns L'utente con il saldo aggiornato.
     * @throws HttpError 404 se l'utente non esiste.
     */
async updateCredit(
    email: string,
    credit: number
): Promise<User> {

    console.log('Updating credit:', {email, amount: credit});

    // Delega al DAO la ricerca dell'utente e l'aggiornamento del saldo.
    const user = await this.userDAO.updateCredit(email, credit);

    if (!user) {
        throw new HttpError(404, 'User not found');
    }

    console.log('Credit updated successfully:', {email, amount: credit});

    return user;
}

}
