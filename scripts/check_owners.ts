import "dotenv/config";
import { MongoClient } from 'mongodb';

async function debug() {
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('playkers');

        const users = await db.collection('users').find({}).toArray();
        console.log('--- USERS ---');
        users.forEach(u => console.log(`User: ${u.email} | ID: ${u.id}`));

        const venues = await db.collection('venues').find({}).toArray();
        console.log('\n--- VENUES ---');
        venues.forEach(v => console.log(`Venue: ${v.name} (ID: ${v.id}) | OwnerID: ${v.ownerId}`));

        const bookings = await db.collection('bookings').find({}).toArray();
        console.log(`\n--- BOOKINGS ---`);
        bookings.forEach(b => console.log(`Booking ID: ${b.id} | VenueID: ${b.venueId} | UserID: ${b.userId} | Status: ${b.status}`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}
debug();
