const io= require('socket.io')(5500,{
    cors:{
        origin:'*' // Allow all origins for CORS, useful for development
    }
});

console.log(`server is running`);

/**
 * @type {Array<[string, string]>} currentUsersList - Stores active users as a list of [socketId, username] pairs.
 */
const currentUsersList=[];

/**
 * Handles new client connections to the Socket.IO server.
 * Each connected socket represents a unique client.
 */
io.on('connection', socket=>{
    // Log the ID of the newly connected socket for debugging purposes.
    console.log(socket.id);

    /**
     * Event listener for 'username' event.
     * Triggered when a client sends their username upon connecting.
     * @param {object} user - An object containing the username, e.g., { user: "player1" }.
     */
    socket.on('username',(user)=>{
        // If the username is null, do not process the connection.
        if (user.user==null) {
            return;
        }
        console.log(`${user.user} has connected`);
        // Add the new user's socket ID and username to the list of current users.
        currentUsersList.push([socket.id,user.user])
        // Emit the updated list of users to all connected clients.
        io.emit('newUsersList', { data:currentUsersList});

    })

    /**
     * Event listener for 'disconnect' event.
     * Triggered when a client disconnects from the server.
     */
    socket.on('disconnect',()=>{
        // Iterate through the current users list to find and remove the disconnected user.
        for (let i = 0; i < currentUsersList.length; i++) {
            let cur = currentUsersList[i];
            // Check if the socket ID matches the disconnected client.
            if (cur[0]==socket.id) {
                currentUsersList.splice(i,1); // Remove the user from the list.
                break; // Exit loop once user is found and removed.
            }
            
        }
        // Emit the updated list of users to all connected clients after a user disconnects.
        io.emit('newUsersList', { data:currentUsersList});
    })

    /**
     * Event listener for 'opponentSelected' event.
     * Triggered when a user selects an opponent to play against.
     * @param {object} data - Contains opponentId and the requesting user's information.
     *   e.g., { opponentId: 'socketIdOfOpponent', user: 'requestingUsername' }.
     */
    socket.on('opponentSelected',(data)=>{
        // Emit a 'matchRequest' event specifically to the selected opponent.
        io.to(data.opponentId).emit('matchRequest',{opponent:data.user,opponentId:socket.id})
    })
    
    /**
     * Event listener for 'matchRequestAccepted' event.
     * Triggered when a match request is accepted by the recipient.
     * @param {object} data - Contains opponentId (of the requester) and the accepting opponent's information.
     *   e.g., { opponentId: 'socketIdOfRequester', opponent: 'acceptingUsername' }.
     */
    socket.on('matchRequestAccepted',(data)=>{
        // Emit 'matchRequestAccepted' back to the original requester, indicating acceptance.
        io.to(data.opponentId).emit('matchRequestAccepted',{opponent:data.opponent , opponentId:socket.id})
    })
    
    /**
     * Event listener for 'matchRequestRejected' event.
     * Triggered when a match request is rejected by the recipient.
     * @param {object} data - Contains opponentId (of the requester) and the rejecting opponent's information.
     *   e.g., { opponentId: 'socketIdOfRequester', opponent: 'rejectingUsername' }.
     */
    socket.on('matchRequestRejected',(data)=>{
        // Emit 'matchRequestRejected' back to the original requester, indicating rejection.
        io.to(data.opponentId).emit('matchRequestRejected',{opponent:data.opponent});
    })
   
    /**
     * Event listener for 'yourTurn' event.
     * Triggered when a player makes a move, signaling the opponent that it's their turn.
     * @param {object} data - Contains opponentId and details of the current move.
     *   e.g., { opponentId: 'socketIdOfOpponent', currentCell: 'A1' }.
     */
    socket.on('yourTurn',(data)=>{
       // Emit 'myTurn' to the opponent, forwarding the move details.
       io.to(data.opponentId).emit('myTurn',{opponentId:socket.id ,currentCell:data.currentCell}); 
    })

    /**
     * Event listener for 'I_won' event.
     * Triggered when a player wins the game.
     * @param {object} data - Contains opponentId and details of the winning move.
     *   e.g., { opponentId: 'socketIdOfOpponent', currentCell: 'C3' }.
     */
    socket.on('I_won',(data)=>{
        // Emit 'You_lose' to the opponent, notifying them of the game outcome.
        io.to(data.opponentId).emit('You_lose',{currentCell:data.currentCell});    
    })

    /**
     * Event listener for 'Match_draw' event.
     * Triggered when a game ends in a draw.
     * @param {object} data - Contains opponentId and details of the final move leading to a draw.
     *   e.g., { opponentId: 'socketIdOfOpponent', currentCell: 'B2' }.
     */
    socket.on('Match_draw',(data)=>{
        // Emit 'Match_draw' to the opponent, notifying them of the draw.
        io.to(data.opponentId).emit('Match_draw',{currentCell:data.currentCell});
    })

    /**
     * Event listener for 'Player_left' event.
     * Triggered when a player leaves an ongoing game.
     * @param {object} data - Contains opponentId.
     *   e.g., { opponentId: 'socketIdOfOpponent' }.
     */
    socket.on('Player_left',(data)=>{
        // Emit 'Player_left' to the opponent, notifying them that their opponent has left.
        io.to(data.opponentId).emit('Player_left');
    })
})