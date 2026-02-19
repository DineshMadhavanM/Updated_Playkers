import "dotenv/config";
import { MongoClient } from 'mongodb';

async function fixOwnership() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI not found in .env");
        process.exit(1);
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('playkers');
        const users = db.collection('users');
        const venues = db.collection('venues');

        // 1. Find the user
        const targetEmail = "kit27.ad17@gmail.com";
        const user = await users.findOne({ email: targetEmail });

        if (!user) {
            console.error(`User with email ${targetEmail} not found.`);
            return;
        }

        console.log(`Found user: ${user.id} (${targetEmail})`);

        // 2. Find the venue
        const venueName = "Turf";
        const venue = await venues.findOne({ name: { $regex: new RegExp(`^${venueName}$`, 'i') } });

        if (!venue) {
            console.error(`Venue with name matching "${venueName}" not found.`);
            // List some venues to help debug
            const allVenues = await venues.find({}).limit(5).toArray();
            console.log("Current venues in DB:", allVenues.map(v => v.name));
            return;
        }

        console.log(`Found venue: ${venue.id} (${venue.name})`);

        // 3. Update the ownerId
        const result = await venues.updateOne(
            { id: venue.id },
            { $set: { ownerId: user.id, updatedAt: new Date() } }
        );

        if (result.modifiedCount > 0) {
            console.log(`Successfully updated ${venue.name} owner to ${user.id}`);
        } else {
            console.log(`No changes made to ${venue.name}. It might already be owned by this user.`);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}

fixOwnership();
