import "dotenv/config";
import { MongoClient } from 'mongodb';

async function verifyBookingNotificationFlow() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('playkers');

        const booking = await db.collection('bookings').findOne({}, { sort: { createdAt: -1 } });
        console.log(`LATEST_BOOKING: id=${booking?.id}, venueId=${booking?.venueId}`);

        const venue = await db.collection('venues').findOne({ id: booking?.venueId });
        console.log(`VENUE_FOUND: ${!!venue}, id=${venue?.id}, ownerId=${venue?.ownerId}`);

        if (venue) {
            console.log("IF CONDITION SHOULD PASS: venue && venue.ownerId is", !!(venue && venue.ownerId));
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}
verifyBookingNotificationFlow();
