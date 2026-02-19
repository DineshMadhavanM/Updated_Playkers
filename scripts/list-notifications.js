import "dotenv/config";
import { MongoClient } from 'mongodb';

async function listNotifications() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('playkers');

        const notifications = await db.collection('notifications').find({}).toArray();
        console.log(`TOTAL_NOTIFICATIONS: ${notifications.length}`);
        notifications.forEach(n => {
            console.log(`- ID: ${n.id.slice(0, 8)}, Type: ${n.type}, Recipient: ${n.recipientUserId}, Status: ${n.status}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}
listNotifications();
