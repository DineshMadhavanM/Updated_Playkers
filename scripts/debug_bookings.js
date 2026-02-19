const { MongoClient } = require('mongodb');
require('dotenv').config();

async function debug() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('playkers');

        const users = await db.collection('users').find({}).toArray();
        const user = users.find(u => u.email === 'suthanv@gmail.com');

        if (!user) {
            console.log('User suthanv@gmail.com not found');
            return;
        }

        console.log('--- USER ---');
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);

        const venues = await db.collection('venues').find({ ownerId: user.id }).toArray();
        console.log(`\n--- VENUES OWNED BY USER (${venues.length}) ---`);
        venues.forEach(v => {
            console.log(`- Venue ID: ${v.id}, Name: ${v.name}`);
        });

        const allBookings = await db.collection('bookings').find({}).toArray();
        console.log(`\n--- ALL BOOKINGS (${allBookings.length}) ---`);

        if (venues.length > 0) {
            console.log('\n--- ANALYZING BOOKINGS FOR USER VENUES ---');
            for (const venue of venues) {
                const venueBookings = allBookings.filter(b => b.venueId === venue.id);
                console.log(`Venue: ${venue.name} (${venue.id}) has ${venueBookings.length} bookings`);
                venueBookings.forEach(b => {
                    console.log(`  - Booking ID: ${b.id}, Status: ${b.status}, Booker ID: ${b.userId}`);
                });
            }
        } else {
            console.log('\nUser has no venues.');
        }

        const myBookings = allBookings.filter(b => b.userId === user.id);
        console.log(`\n--- BOOKINGS MADE BY USER (${myBookings.length}) ---`);
        myBookings.forEach(b => {
            console.log(`- Booking ID: ${b.id}, Venue ID: ${b.venueId}, Status: ${b.status}`);
        });

    } catch (error) {
        console.error('Error during debugging:', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

debug();
