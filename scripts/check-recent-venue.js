import "dotenv/config";
import { MongoClient } from 'mongodb';

async function checkRecentBookingVenue() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('playkers');

        const booking = await db.collection('bookings').findOne({}, { sort: { createdAt: -1 } });
        if (!booking) {
            console.log("NO BOOKINGS FOUND");
            return;
        }

        console.log(`BOOKING_ID: ${booking.id}, VENUE_ID: ${booking.venueId}`);

        const venue = await db.collection('venues').findOne({ id: booking.venueId });
        if (!venue) {
            console.log("VENUE NOT FOUND IN DB");
            return;
        }

        console.log(`VENUE_NAME: ${venue.name}, OWNER_ID: ${venue.ownerId}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}
checkRecentBookingVenue();
