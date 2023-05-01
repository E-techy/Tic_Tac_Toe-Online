# Tic_Tac_Toe-Online

This a simple online tic tac toe game. 

# how the game works
It users socket.io to send and receive requests between clients and server.
In this game we can see the users using who are currently online and
send a match request to them. If the user accepts the match request then the game is started between the two users.
if any one of the user clicks on the reset key then the match is ended or we can say connection between the users gets lost. 
So every time when a match is won or is draw or is lost the user have to reset the match.
and select the opponent again with whom he/ she wants a match with.



# how to start the server 

start the node server using "npm run dev" which will run on port 5500;
also open the index.html file in the browser using live server or just in some other ways.
