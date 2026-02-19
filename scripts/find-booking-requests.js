import "dotenv/config";
import { MongoClient } from 'mongodb';

async function findBookingRequests() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('playkers');

        const bookingNotifications = await db.collection('notifications').find({ type: "booking_request" }).toArray();
        console.log(`TOTAL BOOKING REQUESTS: ${bookingNotifications.length}`);
        bookingNotifications.forEach(n => {
            console.log(`- ID: ${n.id}, Recipient: ${n.recipientUserId}, Status: ${n.status}, Message: ${n.message}`);
        });

        if (bookingNotifications.length === 0) {
            console.log("No booking_request notifications found in DB.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}
findBookingRequests();
