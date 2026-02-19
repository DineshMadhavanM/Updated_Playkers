import "dotenv/config";
import { MongoClient } from 'mongodb';

async function listAllUsers() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('playkers');

        const users = await db.collection('users').find({}).toArray();
        console.log(`TOTAL USERS: ${users.length}`);
        users.forEach(u => {
            console.log(`- ID: ${u.id}, Email: ${u.email}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}
listAllUsers();
