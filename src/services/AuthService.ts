import bcrypt from 'bcrypt';
import { UserDAO } from '../dao/UserDAO.js';
import { HttpError } from '../middleware/errorHandler.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Service responsabile della logica di autenticazione.
 *
 * Recupera l'utente attraverso UserDAO, verifica la password
 * e genera un token JWT contenente i metadati dell'utente.
 */
export class AuthService {

    private userDAO: UserDAO;

    constructor() {
        this.userDAO = new UserDAO();
    }

    /**
     * Autentica un utente tramite email e password.
     *
     * @param email - Email utilizzata per il login.
     * @param password - Password fornita dall'utente.
     * @returns Token JWT dell'utente autenticato.
     * @throws HttpError 401 se le credenziali non sono valide.
     */
    async login(
        email: string,
        password: string
    ): Promise<string> {

        // Ricerca l'utente nel database tramite il DAO.
        const user = await this.userDAO.findByEmail(email);

        if (!user) {
            throw new HttpError(401, 'Invalid credentials');
        }

        // Confronta la password fornita con l'hash salvato nel database.
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            throw new HttpError(401, 'Invalid credentials');
        }

        // Genera il JWT inserendo soltanto i metadati dell'utente.
        const token = generateToken({
            userId: user.id,
            username: user.username,
            role: user.role
        });

        return token;
    }
}
