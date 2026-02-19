import "dotenv/config";
import { MongoClient } from 'mongodb';

async function debug() {
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('playkers');

        console.log('--- ALL USERS ---');
        const users = await db.collection('users').find({}).toArray();
        users.forEach(u => console.log(`ID: ${u.id}, Email: ${u.email}`));

        console.log('\n--- ALL VENUES ---');
        const venues = await db.collection('venues').find({}).toArray();
        venues.forEach(v => console.log(`Venue: ${v.name}, OwnerID: ${v.ownerId}`));

        const user = users.find(u => u.email === 'suthanv@gmail.com');
        if (user) {
            console.log(`\nVerified: suthanv@gmail.com has ID: ${user.id}`);
            const userVenues = venues.filter(v => v.ownerId === user.id);
            console.log(`Venues owned by this ID: ${userVenues.length}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}
debug();
