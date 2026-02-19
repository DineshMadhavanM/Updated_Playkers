import "dotenv/config";
import { MongoClient } from 'mongodb';

async function cleanupNotifications() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('playkers');

        const result = await db.collection('notifications').deleteMany({
            $or: [
                { type: { $exists: false } },
                { type: null },
                { type: "undefined" }
            ]
        });

        console.log(`DELETED ${result.deletedCount} malformed notifications.`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}
cleanupNotifications();
