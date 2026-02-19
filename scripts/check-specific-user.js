import "dotenv/config";
import { MongoClient } from 'mongodb';

async function checkSpecificUser() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('playkers');

        const venue = await db.collection('venues').findOne({ name: /Turf/i });
        console.log(`VENUE: ${venue?.name}, OWNER_ID: ${venue?.ownerId}`);

        if (venue?.ownerId) {
            const user = await db.collection('users').findOne({ id: venue.ownerId });
            console.log(`USER_FOR_OWNER_ID: Email: ${user?.email}, ID: ${user?.id}`);
        }

        const kitUser = await db.collection('users').findOne({ email: "kit27.ad17@gmail.com" });
        console.log(`USER_FOR_KIT_EMAIL: Email: ${kitUser?.email}, ID: ${kitUser?.id}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}
checkSpecificUser();
