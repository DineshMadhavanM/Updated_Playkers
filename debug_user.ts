import "dotenv/config";
import { MongoStorage } from "./server/mongoStorage";

async function run() {
    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI not found in env");
        return;
    }

    const storage = new MongoStorage(process.env.MONGODB_URI);
    try {
        await storage.connect();

        // @ts-ignore
        const db = storage['db'];

        console.log("--- Collection List and Counts ---");
        const collections = await db.listCollections().toArray();
        for (const coll of collections) {
            const count = await db.collection(coll.name).countDocuments();
            console.log(`- ${coll.name}: ${count} docs`);
        }

        const targetEmail = "kit27.ad17@gmail.com";
        console.log(`\n--- Searching for exact email match: "${targetEmail}" ---`);
        const playersByEmail = await db.collection('players').find({ email: targetEmail }).toArray();
        console.log(`Players found by exact email: ${playersByEmail.length}`);
        playersByEmail.forEach((p: any) => console.log(`- ID: ${p.id}, Email: "${p.email}", Name: "${p.name}"`));

        console.log(`\n--- Searching for email with regex (case-insensitive): /${targetEmail}/i ---`);
        const playersByRegex = await db.collection('players').find({ email: { $regex: new RegExp(targetEmail, 'i') } }).toArray();
        console.log(`Players found by regex: ${playersByRegex.length}`);
        playersByRegex.forEach((p: any) => console.log(`- ID: ${p.id}, Email: "${p.email}", Name: "${p.name}"`));

        // Check if any PlayerPerformance has this playerId
        if (playersByRegex.length > 0) {
            const pId = playersByRegex[0].id;
            const perfs = await db.collection('playerPerformances').find({ playerId: pId }).toArray();
            console.log(`\nPerformances for first player ID (${pId}): ${perfs.length}`);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit(0);
    }
}

run();
