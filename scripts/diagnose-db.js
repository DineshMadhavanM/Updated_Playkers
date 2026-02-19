import "dotenv/config";
import { MongoClient } from 'mongodb';

async function diagnose() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI not found in .env");
        process.exit(1);
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('playkers');

        console.log("--- USERS ---");
        const users = await db.collection('users').find({}).toArray();
        users.forEach(u => console.log(`ID: ${u.id}, Email: ${u.email}, Name: ${u.firstName} ${u.lastName}`));

        console.log("\n--- VENUES ---");
        const venues = await db.collection('venues').find({}).toArray();
        venues.forEach(v => console.log(`ID: ${v.id}, Name: ${v.name}, OwnerId: ${v.ownerId}`));

        console.log("\n--- NOTIFICATIONS ---");
        const notifications = await db.collection('notifications').find({}).sort({ createdAt: -1 }).limit(10).toArray();
        notifications.forEach(n => console.log(`ID: ${n.id}, Recipient: ${n.recipientUserId}, Type: ${n.type}, Status: ${n.status}, Message: ${n.message}`));

        console.log("\n--- BOOKINGS ---");
        const bookings = await db.collection('bookings').find({}).sort({ createdAt: -1 }).limit(5).toArray();
        bookings.forEach(b => console.log(`ID: ${b.id}, VenueId: ${b.venueId}, UserId: ${b.userId}, Status: ${b.status}`));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}

diagnose();
