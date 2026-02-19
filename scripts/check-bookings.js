import "dotenv/config";
import { MongoClient } from 'mongodb';

async function checkBookings() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('playkers');

        const bookings = await db.collection('bookings').find({}).sort({ createdAt: -1 }).limit(5).toArray();
        console.log(`TOTAL BOOKINGS IN DB: ${bookings.length}`);
        bookings.forEach(b => {
            console.log(`- ID: ${b.id}, VenueId: ${b.venueId}, UserId: ${b.userId}, CreatedAt: ${b.createdAt}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}
checkBookings();
