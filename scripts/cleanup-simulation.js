import "dotenv/config";
import { MongoClient } from 'mongodb';

async function cleanupSimulation() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('playkers');

        const bookingResult = await db.collection('bookings').deleteMany({ id: { $regex: /^booking-sim-/ } });
        const notificationResult = await db.collection('notifications').deleteMany({ message: { $regex: /\[SIMULATION\]/ } });

        console.log(`DELETED ${bookingResult.deletedCount} simulation bookings and ${notificationResult.deletedCount} notifications.`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}
cleanupSimulation();
