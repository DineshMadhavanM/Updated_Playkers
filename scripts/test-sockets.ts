import { io } from 'socket.io-client';

const MATCH_ID = 'test-match-123';
const REGION = 'Coimbatore';

console.log('--- Socket.io Verification Script ---');

const socket = io('http://localhost:5000', {
    reconnection: false
});

socket.on('connect', () => {
    console.log('✅ Connected to server');

    // Test Match Room
    console.log(`Joining match room: ${MATCH_ID}`);
    socket.emit('joinMatch', MATCH_ID);

    // Test Region Room
    console.log(`Joining region room: ${REGION}`);
    socket.emit('joinRegion', REGION);
});

socket.on('scoreUpdated', (match) => {
    console.log('🔴 Match Update Received:', match.id);
    if (match.id === MATCH_ID) {
        console.log('✅ Correct match update received');
    }
});

socket.on('regionScoreUpdate', (update) => {
    console.log('🌍 Region Update Received:', update.region);
    if (update.matchId === MATCH_ID) {
        console.log('✅ Correct region update received');
    }
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected');
});

setTimeout(() => {
    console.log('Closing test...');
    socket.disconnect();
    process.exit(0);
}, 10000);
