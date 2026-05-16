/**
 * @file This script manages the client-side logic for a Tic-Tac-Toe game,
 * handling user interaction, real-time communication with a server via Socket.IO,
 * and game state management.
 */

// --- DOM Element References ---
// Get the button element for navigating back to the offline mode.
const offlineButton = document.getElementById('offlineButton');
// Get the DOM element to display the current username.
const usernameShowing = document.getElementById('username');
// Get the select element to display the list of available users.
const usersListShow = document.getElementById('usersList');
// Get the DOM element to display who the current user is playing with.
const playingWith = document.getElementById('playingWith');
// Get the DOM element to indicate whose turn it is.
const whoseTurn = document.getElementById('whoseTurn');

// --- User Initialization ---
// Prompt the user to enter their name upon page load.
const username = prompt('Enter your name');
// Update the username display on the page with the entered name.
usernameShowing.innerText = username;

// --- Socket.IO Connection ---
// Initialize a Socket.IO connection to the server running on localhost port 5500.
const socket = io('http://localhost:5500');

// --- Socket Event Listeners ---
/**
 * Event listener for when the socket successfully connects to the server.
 * Logs a message to the console indicating a successful connection.
 */
socket.on('connect', () => {
    console.log('connected to server');
});

/**
 * Emits the current user's username to the server immediately after connecting.
 * This registers the user with the server.
 */
socket.emit('username', { user: username });

// --- Opponent Selection Implementation ---
/**
 * Event listener for receiving an updated list of online users from the server.
 * This list is used to populate the dropdown for selecting an opponent.
 * @param {object} usersList - An object containing an array of available users.
 *   Each user is represented as an array [socketId, username].
 */
socket.on('newUsersList', (usersList) => {
    removeOptions(); // Clear existing options before populating new ones.
    // Iterate through the list of users received from the server.
    for (let i = 0; i < usersList.data.length; i++) {
        const currentUser = usersList.data[i];
        // Skip the current user from being added to their own opponent list.
        if (currentUser[0] == socket.id) {
            continue;
        }
        // Create a new option element for the dropdown.
        var option = document.createElement("option");
        option.text = currentUser[1]; // Set the display text to the username.
        option.value = currentUser[0]; // Set the value to the user's socket ID.
        usersListShow.add(option); // Add the option to the select element.
    }
});

/**
 * Removes all dynamically added options from the opponent selection dropdown,
 * keeping only the initial "Select an opponent" placeholder.
 */
function removeOptions() {
    const options = usersListShow.options;
    // Iterate over all options starting from the last one down to the second (index 1),
    // to avoid removing the default "Select an opponent" option at index 0.
    for (let i = options.length - 1; i >= 1; i--) {
        usersListShow.remove(i);
    }
}

/**
 * Event listener for when the user selects an opponent from the dropdown.
 * Emits a 'opponentSelected' event to the server with the chosen opponent's ID.
 */
usersListShow.addEventListener('change', function () {
    // Get the currently selected option from the dropdown.
    var option = usersListShow.options[usersListShow.selectedIndex];
    // Emit an event to the server indicating the selected opponent.
    socket.emit('opponentSelected', {
        opponentId: option.value, // The socket ID of the selected opponent.
        user: username // The current user's username.
    });
});

// Variable to store the ID of the current opponent.
var opponentId;

// --- Match Request Handling ---
/**
 * Event listener for receiving a 'matchRequest' from another user.
 * Displays a modal asking the current user to accept or reject the match.
 * @param {object} data - Object containing the opponent's name and ID.
 * @param {string} data.opponent - The username of the player who sent the request.
 * @param {string} data.opponentId - The socket ID of the player who sent the request.
 */
socket.on('matchRequest', (data) => {
    // Get references to the match request modal and its elements.
    const matchRequest = document.getElementById('matchRequest');
    const opponentName = document.getElementById('opponentName');
    const matchRequestAcceptButton = document.getElementById('matchRequestAcceptButton');
    const matchRequestRejectButton = document.getElementById('matchRequestRejectButton');

    // Update the modal text to show who sent the request.
    opponentName.innerText = data.opponent + ' has requested a match with you.';

    /**
     * Event listener for the "Accept" button in the match request modal.
     * Emits 'matchRequestAccepted' to the server, hides the modal,
     * updates the UI to show the new opponent, and sets initial turn.
     */
    matchRequestAcceptButton.addEventListener('click', () => {
        // Emit an event to the server confirming acceptance of the match request.
        socket.emit('matchRequestAccepted', { opponent: username, opponentId: data.opponentId });
        opponentId = data.opponentId; // Store the opponent's ID.
        matchRequest.style.display = "none"; // Hide the match request modal.
        playingWith.innerText = `Playing with ${data.opponent}`; // Update the "Playing with" display.
        playingWith.style.display = "block"; // Make the "Playing with" display visible.
        whoseTurn.innerText = "Opponent's turn"; // Indicate that it's the opponent's turn.
    });

    /**
     * Event listener for the "Reject" button in the match request modal.
     * Emits 'matchRequestRejected' to the server and hides the modal.
     */
    matchRequestRejectButton.addEventListener('click', () => {
        // Emit an event to the server indicating rejection of the match request.
        socket.emit('matchRequestRejected', { opponent: username, opponentId: data.opponentId });
        matchRequest.style.display = "none"; // Hide the match request modal.
    });
    // Display the match request modal.
    matchRequest.style.display = "block";
});

/**
 * Event listener for when a 'matchRequestRejected' event is received from the server.
 * Alerts the user that their match request has been rejected by the opponent.
 * @param {object} data - Object containing the opponent's name.
 * @param {string} data.opponent - The username of the player who rejected the request.
 */
socket.on('matchRequestRejected', (data) => {
    alert(` ${data.opponent} has rejected your match request.`);
    // Reset the opponent selection dropdown to no selection.
    usersListShow.selectedIndex = -1;
});

// --- Tic-Tac-Toe Game Logic Variables ---
// CSS class for 'X' marks on the board.
const X_CLASS = 'x';
// CSS class for 'Circle' marks on the board.
const CIRCLE_CLASS = 'circle';
// All possible winning combinations of cell indices on the Tic-Tac-Toe board.
const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// Get all cell elements on the Tic-Tac-Toe board.
const cellElements = document.querySelectorAll('[data-cell]');
// Get the game board element.
const board = document.getElementById('board');
// Get the element for displaying winning/draw messages.
const winningMessageElement = document.getElementById('winning-message');
// Get the restart button (though not fully implemented in this client snippet).
const restartButton = document.getElementById('restartButton');
// Get the reset button for clearing the game.
const resetButton = document.getElementById('resetButton');
// Get the text element within the winning message for dynamic content.
const winningMessageTextElement = document.querySelector('[data-winning-message-text]');
// Variable to track whose turn it is (true for circle, false for X). Not directly used for current player logic in online mode.
let circleTurn;

// --- Offline Button Event Listener ---
/**
 * Event listener for the 'offlineButton' to navigate to the offline game page.
 */
offlineButton.addEventListener('click', () => {
    window.location.href = "../index.html";
});

// --- Reset Button Event Listener ---
/**
 * Event listener for the 'resetButton'.
 * Resets the game board and informs the opponent if a match is in progress.
 */
resetButton.addEventListener('click', () => {
    reset(); // Call the local reset function.
    // If an opponent is currently defined, meaning a match is active.
    if (opponentId != undefined) {
        playingWith.innerText = "You left the Match"; // Update local UI.
        socket.emit('Player_left', { opponentId: opponentId }); // Inform the opponent.
        opponentId = undefined; // Clear the opponent ID as the match has ended.
    }
});

// --- Socket Events for Game Play ---
/**
 * Event listener for 'myTurn' from the server.
 * Indicates that it's the current player's turn after the opponent made a move.
 * @param {object} data - Object containing the ID of the cell played by the opponent.
 * @param {string} data.currentCell - The ID of the cell where the opponent placed their mark.
 */
socket.on('myTurn', (data) => {
    // Apply the opponent's mark (CIRCLE_CLASS) to the specified cell.
    let opponentTurn = document.getElementById(data.currentCell);
    opponentTurn.classList.add(CIRCLE_CLASS);
    whoseTurn.innerText = "Your turn"; // Update UI to indicate current player's turn.
    // Add click listeners back to all cells so the current player can make a move.
    cellElements.forEach((cell) => {
        cell.addEventListener('click', handleClick);
    });
});

/**
 * Event listener for 'matchRequestAccepted' from the server,
 * specifically for the player who INITIATED the match request.
 * Updates the UI to show the opponent and enables board interaction.
 * @param {object} data - Object containing the opponent's name and ID.
 * @param {string} data.opponent - The username of the player who accepted the request.
 * @param {string} data.opponentId - The socket ID of the player who accepted the request.
 */
socket.on('matchRequestAccepted', (data) => {
    opponentId = data.opponentId; // Store the opponent's ID.
    playingWith.innerText = `Playing with ${data.opponent}`; // Update the "Playing with" display.
    playingWith.style.display = "block"; // Make the "Playing with" display visible.
    whoseTurn.innerText = "Your turn"; // Indicate it's the current player's turn (as initiator).

    // Add click listeners to all cells to enable game play.
    cellElements.forEach((cell) => {
        cell.addEventListener('click', handleClick);
    });
});

/**
 * Event listener for 'You_lose' from the server.
 * Indicates that the current player has lost the match.
 * @param {object} data - Object containing the ID of the cell that completed the opponent's winning line.
 * @param {string} data.currentCell - The ID of the cell where the opponent placed their winning mark.
 */
socket.on('You_lose', (data) => {
    // Apply the opponent's winning mark (CIRCLE_CLASS) to the specified cell.
    let currentCell = document.getElementById(data.currentCell);
    currentCell.classList.add(CIRCLE_CLASS);
    playingWith.innerText = 'You lose the match'; // Update local UI.
    whoseTurn.innerText = ''; // Clear turn indicator.
    opponentId = undefined; // Clear opponent ID as the match has ended.
});

/**
 * Event listener for 'Match_draw' from the server.
 * Indicates that the match has ended in a draw.
 * @param {object} data - Object containing the ID of the cell that completed the draw.
 * @param {string} data.currentCell - The ID of the cell where the opponent placed their final mark, resulting in a draw.
 */
socket.on('Match_draw', (data) => {
    // Apply the opponent's final mark (CIRCLE_CLASS) to the specified cell.
    let currentCell = document.getElementById(data.currentCell);
    currentCell.classList.add(CIRCLE_CLASS);
    playingWith.innerText = 'Match Draw'; // Update local UI.
    whoseTurn.innerText = ''; // Clear turn indicator.
    opponentId = undefined; // Clear opponent ID as the match has ended.
});

/**
 * Event listener for 'Player_left' from the server.
 * Indicates that the opponent has left the current match.
 */
socket.on('Player_left', () => {
    reset(); // Reset the local game board.
    // If an opponent was still defined (meaning a match was active), update UI.
    if (opponentId != undefined) {
        playingWith.innerText = "Opponent has left the match."; // Update local UI.
        whoseTurn.innerText = ''; // Clear turn indicator.
        opponentId = undefined; // Clear opponent ID.
    }
});

// --- Game Logic Functions ---
/**
 * Handles a click event on a game cell.
 * Places the current player's mark, checks for win/draw, and then
 * emits the move to the server if the game is still ongoing.
 * @param {Event} e - The click event object.
 */
function handleClick(e) {
    let currentCell = e.target; // The cell that was clicked.
    console.log(e.target); // Log the clicked cell for debugging.
    placeMark(currentCell, X_CLASS); // Place the current player's mark ('X').
    whoseTurn.innerText = "Opponent's turn"; // Update UI to indicate opponent's turn.

    // Remove click listeners from all cells to prevent further moves until 'myTurn' is received.
    cellElements.forEach((cell) => {
        cell.removeEventListener('click', handleClick);
    });

    // Check if the current player has won.
    if (checkWin(X_CLASS)) {
        // If won, emit 'I_won' to the server.
        socket.emit('I_won', { currentCell: e.target.id, opponentId: opponentId });
        playingWith.innerText = "You have won the match"; // Update local UI.
        whoseTurn.innerText = ''; // Clear turn indicator.
        opponentId = undefined; // Clear opponent ID as the match has ended.
    }
    // Check if the game is a draw.
    else if (isDraw()) {
        playingWith.innerText = "Match Draw"; // Update local UI.
        whoseTurn.innerText = ''; // Clear turn indicator.
        // If draw, emit 'Match_draw' to the server.
        socket.emit('Match_draw', { currentCell: e.target.id, opponentId: opponentId });
        opponentId = undefined; // Clear opponent ID as the match has ended.
    }
    // If no win or draw, it's the opponent's turn.
    else {
        // Emit 'yourTurn' to the server, informing the opponent of the move.
        socket.emit('yourTurn', { currentCell: e.target.id, opponentId: opponentId });
    }
}

/**
 * Places a mark (X or Circle) on a specified cell.
 * @param {HTMLElement} cell - The cell element to place the mark on.
 * @param {string} currentClass - The CSS class representing the mark (X_CLASS or CIRCLE_CLASS).
 */
function placeMark(cell, currentClass) {
    cell.classList.add(currentClass);
}

/**
 * Checks if a player has won the game with the given mark.
 * @param {string} currentClass - The CSS class of the mark to check for a win (X_CLASS or CIRCLE_CLASS).
 * @returns {boolean} - True if the player has won, false otherwise.
 */
function checkWin(currentClass) {
    // Iterate through all winning combinations.
    return WINNING_COMBINATIONS.some(combination => {
        // For each combination, check if all cells in that combination contain the currentClass.
        return combination.every(index => {
            return cellElements[index].classList.contains(currentClass);
        });
    });
}

/**
 * Checks if the game has ended in a draw.
 * A draw occurs when all cells are filled and no player has won.
 * @returns {boolean} - True if the game is a draw, false otherwise.
 */
function isDraw() {
    // Check if every cell contains either an 'X' or a 'Circle' mark.
    return [...cellElements].every(cell => {
        return cell.classList.contains(X_CLASS) ||
            cell.classList.contains(CIRCLE_CLASS);
    });
}

/**
 * Resets the game board to its initial state.
 * Clears all marks, removes event listeners, and resets UI messages.
 */
function reset() {
    cellElements.forEach((cell) => {
        cell.classList.remove(X_CLASS); // Remove 'X' mark.
        cell.classList.remove(CIRCLE_CLASS); // Remove 'Circle' mark.
        cell.removeEventListener('click', handleClick); // Remove click listeners.
    });
    playingWith.innerText = ""; // Clear "Playing with" message.
    whoseTurn.innerText = ''; // Clear turn indicator.
    usersListShow.selectedIndex = -1; // Reset opponent selection dropdown.
}