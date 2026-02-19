import "dotenv/config";
import { MongoClient } from 'mongodb';

async function fix() {
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('playkers');

        const user = await db.collection('users').findOne({ email: 'suthanv@gmail.com' });
        if (!user) {
            console.log('User suthanv@gmail.com not found');
            return;
        }

        // Find venues that should probably belong to this user
        // (e.g., ID starting with venue-<user_id_part>)
        const venues = await db.collection('venues').find({}).toArray();
        for (const venue of venues) {
            if (venue.id.includes(user.id.replace('user-', ''))) {
                console.log(`Fixing venue ${venue.name} (ID: ${venue.id}) - setting owner to ${user.id}`);
                await db.collection('venues').updateOne(
                    { id: venue.id },
                    { $set: { ownerId: user.id } }
                );
            }
        }

        console.log('Update complete.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}
fix();
