import "dotenv/config";
import { MongoClient } from 'mongodb';

async function checkOwnerNotifications() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('playkers');

        const owner = await db.collection('users').findOne({ email: "kit27.ad17@gmail.com" });
        if (!owner) {
            console.log("OWNER NOT FOUND");
            return;
        }
        console.log(`OWNER ID: ${owner.id}`);

        const notifications = await db.collection('notifications').find({ recipientUserId: owner.id }).toArray();
        console.log(`OWNER HAS ${notifications.length} NOTIFICATIONS`);
        notifications.forEach(n => {
            console.log(`- ID: ${n.id}, Type: ${n.type}, Status: ${n.status}, Msg: ${n.message?.slice(0, 30)}...`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}
checkOwnerNotifications();
