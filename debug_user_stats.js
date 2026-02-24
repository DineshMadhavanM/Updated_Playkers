const { MongoClient } = require('mongodb');

async function run() {
    const uri = 'mongodb+srv://fixlyplaykers_db_user:fixlyplayker@cluster0.fbleyeo.mongodb.net/';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('players_booking_db'); // Let's check common db names or list them

        // First, list databases to be sure
        const admin = client.db().admin();
        const dbs = await admin.listDatabases();
        console.log('Available databases:', dbs.databases.map(d => d.name));

        // Try to find the right DB - usually it's in the URI or we can check 'playkers' or 'players_booking_db'
        const dbName = dbs.databases.find(d => d.name === 'playkers' || d.name === 'players_booking_db')?.name || 'playkers';
        console.log(`Using database: ${dbName}`);
        const targetDb = client.db(dbName);

        const email = 'kit27.ad17@gmail.com';

        console.log(`--- Checking Status for: ${email} ---`);

        // 1. Find User
        const user = await targetDb.collection('users').findOne({
            email: { $regex: new RegExp('^' + email.replace('.', '\\.') + '$', 'i') }
        });
        console.log('User found:', user ? { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } : 'NOT FOUND');

        // 2. Find Linked Players
        const players = await targetDb.collection('players').find({
            email: { $regex: new RegExp('^' + email.replace('.', '\\.') + '$', 'i') }
        }).toArray();

        console.log(`Players found: ${players.length}`);
        players.forEach(p => {
            console.log(`- Player ID: ${p.id}, TeamID: ${p.teamId}, Name: ${p.name}, userId: ${p.userId}`);
        });

        if (user) {
            // 3. Find Performances by userId
            const userPerfs = await targetDb.collection('playerPerformances').find({ userId: user.id }).toArray();
            console.log(`Performances linked by userId (${user.id}): ${userPerfs.length}`);

            // 4. Find matches where this user is a participant
            const userMatches = await targetDb.collection('matches').find({
                $or: [
                    { 'matchData.team1Players': user.id },
                    { 'matchData.team2Players': user.id }
                ]
            }).toArray();
            console.log(`Matches where userId appears as participant: ${userMatches.length}`);
        }

        if (players.length > 0) {
            const pIds = players.map(p => p.id);
            // 5. Find Performances by playerId
            const playerPerfs = await targetDb.collection('playerPerformances').find({ playerId: { $in: pIds } }).toArray();
            console.log(`Performances linked by playerId(s): ${playerPerfs.length}`);

            // 6. Find matches where these playerIds appear
            const playerMatches = await targetDb.collection('matches').find({
                $or: [
                    { 'matchData.team1Players': { $in: pIds } },
                    { 'matchData.team2Players': { $in: pIds } }
                ]
            }).toArray();
            console.log(`Matches where playerIds appear as participant: ${playerMatches.length}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

run();
