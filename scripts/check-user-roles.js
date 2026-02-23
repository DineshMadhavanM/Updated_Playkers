
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function checkRoles() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    let user = null;
    let jokerTeam = null;
    let allPlayers = [];

    try {
        await client.connect();
        const db = client.db('playkers');
        const users = db.collection('users');
        const players = db.collection('players');
        const teams = db.collection('teams');

        const email = 'kit27.ad17@gmail.com';
        console.log(`Checking roles for: ${email}`);

        user = await users.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
        if (!user) {
            console.log('User not found in users collection');
        } else {
            console.log('User found:', JSON.stringify({
                id: user.id,
                _id: user._id,
                email: user.email,
                isAdmin: user.isAdmin
            }, null, 2));

            // Collect all players for the results object
            allPlayers = await players.find({
                $or: [
                    { userId: user.id },
                    { userId: user._id },
                    { email: { $regex: new RegExp(`^${email}$`, 'i') } }
                ]
            }).toArray();
        }

        // Also check for "jokers" or "joker" team
        jokerTeam = await teams.findOne({ name: /joker/i });
        if (jokerTeam) {
            console.log('Joker Team found:', JSON.stringify({
                id: jokerTeam.id,
                name: jokerTeam.name
            }, null, 2));
        } else {
            console.log('Joker Team not found');
        }

        const results = {
            user: user ? {
                id: user.id,
                _id: user._id,
                email: user.email,
                isAdmin: user.isAdmin
            } : null,
            players: allPlayers.map(p => ({
                id: p.id,
                _id: p._id,
                userId: p.userId,
                email: p.email,
                teamId: p.teamId,
                teamRole: p.teamRole
            })),
            jokerTeam: jokerTeam ? { id: jokerTeam.id, name: jokerTeam.name } : null
        };

        const outputPath = 'c:\\PLAYKERS-BOOKING_NEW-main (2)\\PLAYKERS-BOOKING_NEW-main\\scripts\\user-roles.json';
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`Results written to ${outputPath}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkRoles();
