import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { sequelize } from '../shared/db.js';
import { User } from '../models/User.js';

dotenv.config();

async function main() {
    await sequelize.authenticate();

    console.log('Database connected');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    await User.findOrCreate({
        where: {
            email: 'admin@example.com'
        },
        defaults: {
            username: 'Admin',
            email: 'admin@example.com',
            password: adminPassword,
            role: 'admin',
            credit: 1000.00
        }
    });

    await User.findOrCreate({
        where: {
            email: 'user@example.com'
        },
        defaults: {
            username: 'User',
            email: 'user@example.com',
            password: userPassword,
            role: 'user',
            credit: 100.00
        }
    });

    console.log('Seed completed');

    await sequelize.close();
}

main().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
});