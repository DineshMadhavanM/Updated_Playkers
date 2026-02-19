import "dotenv/config";
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

async function simulateBooking() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('playkers');

        // 1. Find a venue and the user who will book it
        const venue = await db.collection('venues').findOne({ name: /Turf/i });
        const user = await db.collection('users').findOne({ email: "suthanv@gmail.com" }); // A different user or any user

        if (!venue || !user) {
            console.log("VENUE or USER NOT FOUND");
            return;
        }

        console.log(`SIMULATING BOOKING: User ${user.email} booking Venue ${venue.name} (Owner: ${venue.ownerId})`);

        // 2. Create the booking (following routes.ts logic manually)
        const bookingId = `booking-sim-${Date.now()}`;
        const booking = {
            id: bookingId,
            userId: user.id,
            venueId: venue.id,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString(),
            totalPrice: "500",
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db.collection('bookings').insertOne(booking);
        console.log(`✅ Created booking ${booking.id}`);

        // 3. Trigger Notification (following routes.ts logic)
        console.log(`🔍 Attempting to notify owner for booking ${booking.id}, venueId: ${booking.venueId}`);
        const venueDoc = await db.collection('venues').findOne({ id: booking.venueId });
        if (venueDoc && venueDoc.ownerId) {
            console.log(`🔍 Found venue ${venueDoc.name}, ownerId: ${venueDoc.ownerId}`);

            const notificationData = {
                id: uuidv4(),
                recipientUserId: venueDoc.ownerId,
                senderName: `${user.firstName} ${user.lastName}`,
                senderEmail: user.email,
                senderPhone: user.phoneNumber || "Not provided",
                type: "booking_request",
                bookingId: booking.id,
                location: `${venueDoc.name} - ${venueDoc.city}`,
                message: `[SIMULATION] ${user.email} has requested to book ${venueDoc.name}`,
                status: 'unread',
                createdAt: new Date(),
                readAt: null
            };

            await db.collection('notifications').insertOne(notificationData);
            console.log(`✅ Created simulation notification ${notificationData.id} for owner ${venueDoc.ownerId}`);
        }

    } catch (error) {
        console.error("❌ Simulation failed:", error);
    } finally {
        await client.close();
    }
}
simulateBooking();
