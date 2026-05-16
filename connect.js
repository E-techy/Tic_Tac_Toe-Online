/**
 * @fileoverview This script initializes a Socket.IO client and connects to a local server.
 * It listens for the 'connect' event to confirm a successful connection.
 */

// Initialize a Socket.IO client instance.
// It attempts to connect to the Socket.IO server running at 'http://localhost:5500'.
const socket = io('http://localhost:5500');

// Set up an event listener for the 'connect' event.
// This event is emitted by the Socket.IO client when a successful connection
// to the server has been established.
socket.on('connect', () => {
    // Log a message to the console indicating that the client has successfully
    // connected to the Socket.IO server.
    console.log('connected to server');
});