const io= require('socket.io')(5500,{
    cors:{
        origin:'*'
    }
});
console.log(`server is running`);

const currentUsersList=[];




io.on('connection', socket=>{
    console.log(socket.id);

    socket.on('username',(user)=>{
        if (user.user==null) {
            return;
        }
        console.log(`${user.user} has connected`);
        currentUsersList.push([socket.id,user.user])
        io.emit('newUsersList', { data:currentUsersList});

    })
    socket.on('disconnect',()=>{
        for (let i = 0; i < currentUsersList.length; i++) {
            let cur = currentUsersList[i];
            if (cur[0]==socket.id) {
                currentUsersList.splice(i,1);
            }
            
        }
        io.emit('newUsersList', { data:currentUsersList});
    })

    socket.on('opponentSelected',(data)=>{
        io.to(data.opponentId).emit('matchRequest',{opponent:data.user,opponentId:socket.id})
    })
    
    socket.on('matchRequestAccepted',(data)=>{
        io.to(data.opponentId).emit('matchRequestAccepted',{opponent:data.opponent , opponentId:socket.id})
    })
    
    socket.on('matchRequestRejected',(data)=>{
        io.to(data.opponentId).emit('matchRequestRejected',{opponent:data.opponent});
    })
   
    socket.on('yourTurn',(data)=>{
       io.to(data.opponentId).emit('myTurn',{opponentId:socket.id ,currentCell:data.currentCell}); 
    })

    socket.on('I_won',(data)=>{
        io.to(data.opponentId).emit('You_lose',{currentCell:data.currentCell});    
    })
    socket.on('Match_draw',(data)=>{
        io.to(data.opponentId).emit('Match_draw',{currentCell:data.currentCell});
    })

    socket.on('Player_left',(data)=>{
        io.to(data.opponentId).emit('Player_left');
    })
})