import "dotenv/config";
import { MongoClient } from 'mongodb';

async function diagnose() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('playkers');

        const owner = await db.collection('users').findOne({ email: "kit27.ad17@gmail.com" });
        if (!owner) {
            console.log("RESULT: OWNER_NOT_FOUND");
            return;
        }

        const venues = await db.collection('venues').find({ ownerId: owner.id }).toArray();
        console.log(`RESULT: OWNER_HAS_${venues.length}_VENUES`);
        venues.forEach(v => console.log(`VENUE_OWNED: ${v.name}`));

        const unread = await db.collection('notifications').find({ recipientUserId: owner.id, status: "unread" }).toArray();
        console.log(`RESULT: OWNER_HAS_${unread.length}_UNREAD_NOTIFICATIONS`);

        const allVenues = await db.collection('venues').find({}).toArray();
        console.log(`DEBUG: TOTAL_VENUES_IN_DB: ${allVenues.length}`);
        allVenues.forEach(v => {
            if (v.ownerId !== owner.id) {
                console.log(`VENUE_MISMATCH: ${v.name} owned by ${v.ownerId}`);
            }
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}
diagnose();
