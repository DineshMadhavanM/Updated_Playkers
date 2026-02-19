import "dotenv/config";
import { MongoClient } from 'mongodb';

async function diagnose() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('playkers');

        const owner = await db.collection('users').findOne({ email: "kit27.ad17@gmail.com" });
        console.log(`OWNER_ID: ${owner?.id} (${owner?.email})`);

        const venues = await db.collection('venues').find({}).toArray();
        console.log("VENUES (Name:Owner):", venues.map(v => `${v.name}:${v.ownerId}`));

        const notifications = await db.collection('notifications').find({ status: "unread" }).toArray();
        console.log("UNREAD_NOTIFICATIONS (Type:Recipient):", notifications.map(n => `${n.type}:${n.recipientUserId}`));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}
diagnose();
