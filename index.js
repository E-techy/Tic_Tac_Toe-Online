const offlineButton=document.getElementById('offlineButton');
offlineButton.addEventListener('click',()=>{
    window.location.href="../index.html"
})

const username=prompt('Enter your name')
// const username='meena';
const usernameShowing=document.getElementById('username').innerText=username;
const usersListShow=document.getElementById('usersList');
const playingWith=document.getElementById('playingWith');
const whoseTurn=document.getElementById('whoseTurn');

const socket=io('http://localhost:5500')

socket.on('connect',()=>{
    console.log('connected to server');
})

socket.emit('username',{user:username});



// select opponent implementation

socket.on('newUsersList',(usersList)=>{
    removeOptions();
    for (let i = 0; i < usersList.data.length; i++) {
        const currentUser = usersList.data[i];
        if (currentUser[0]==socket.id) {
            continue ;
        }
        var option = document.createElement("option");
        option.text =currentUser[1] 
        option.value = currentUser[0]
        usersListShow.add(option);
    }
})

function removeOptions() {
    const options = usersListShow.options;
  
    // Iterate over all options starting from the second option
    for (let i = options.length - 1; i >= 1; i--) {
      usersListShow.remove(i);
    }
  }

  
usersListShow.addEventListener('change',function(){
    var option=usersListShow.options[usersListShow.selectedIndex];
    socket.emit('opponentSelected',{
        opponentId:option.value,
        user: username
    })
})


var opponentId;

/// to do more
socket.on('matchRequest',(data)=>{
    const matchRequest=document.getElementById('matchRequest');
    const opponentName=document.getElementById('opponentName');
    const matchRequestAcceptButton=document.getElementById('matchRequestAcceptButton');
    const matchRequestRejectButton=document.getElementById('matchRequestRejectButton');
    opponentName.innerText=data.opponent+' has requested a match with you.'
    matchRequestAcceptButton.addEventListener('click',()=>{
        socket.emit('matchRequestAccepted',{opponent:username , opponentId:data.opponentId})
        opponentId=data.opponentId;
        matchRequest.style.display="none";
        playingWith.innerText=`Playing with ${data.opponent}`;
        playingWith.style.display="block";
        whoseTurn.innerText="Opponent's turn";
    })

    matchRequestRejectButton.addEventListener('click',()=>{
        socket.emit('matchRequestRejected',{opponent:username , opponentId:data.opponentId})
        matchRequest.style.display="none";      
    })
    matchRequest.style.display="block";
})

socket.on('matchRequestRejected',(data)=>{
    alert(` ${data.opponent} has rejected your match request.`);
    usersListShow.selectedIndex=-1;
})



//implementation of data tranfer between the two users when matchRequest is accepted


const X_CLASS='x';
const CIRCLE_CLASS='circle';
const WINNING_COMBINATIONS= [
    [0,1,2],
    [3,4,5],
    [6,7,8],
    [0,3,6],
    [1,4,7],
    [2,5,8],
    [0,4,8],
    [2,4,6]
]

const cellElements =document.querySelectorAll('[data-cell]')
const board= document.getElementById('board')
const winningMessageElement=document.getElementById('winning-message')
const restartButton= document.getElementById('restartButton');
const resetButton= document.getElementById('resetButton');
const winningMessageTextElement=document.querySelector('[data-winning-message-text]')
let circleTurn;

resetButton.addEventListener('click',()=>{
    reset();
    if(opponentId!= undefined){
        playingWith.innerText="You left the Match";
        socket.emit('Player_left',{opponentId:opponentId})
    }
})


socket.on('myTurn',(data)=>{
    let opponentTurn=document.getElementById(data.currentCell);
    opponentTurn.classList.add(CIRCLE_CLASS)
    whoseTurn.innerText="Your turn";
    cellElements.forEach((cell)=>{
        cell.addEventListener('click',handleClick);
    })
})
socket.on('matchRequestAccepted',(data)=>{
    opponentId=data.opponentId;
    playingWith.innerText=`Playing with ${data.opponent}`;
    playingWith.style.display="block";

cellElements.forEach((cell)=>{
    cell.addEventListener('click',handleClick)
})

})

socket.on('You_lose',(data)=>{
    let currentCell=document.getElementById(data.currentCell);
    currentCell.classList.add(CIRCLE_CLASS);
    playingWith.innerText='You lose the match';
    whoseTurn.innerText='';
    opponentId=undefined;
})

socket.on('Match_draw',(data)=>{
    let currentCell=document.getElementById(data.currentCell);
    currentCell.classList.add(CIRCLE_CLASS);
    playingWith.innerText='Match Draw';
    whoseTurn.innerText=''; 
    opponentId=undefined;
})

socket.on('Player_left',()=>{
    reset();
    if (opponentId!=undefined) {
        playingWith.innerText="Opponent has left the match.";
        opponentId=undefined;
    }
})

function handleClick(e) {
    let currentCell=e.target;
    console.log(e.target);
    placeMark(currentCell,X_CLASS);
    whoseTurn.innerText="Opponent's turn";
    cellElements.forEach((cell)=>{
        cell.removeEventListener('click',handleClick)
    })
    if(checkWin(X_CLASS)){
        socket.emit('I_won',{currentCell:e.target.id, opponentId:opponentId});
        playingWith.innerText="You have won the match";
        whoseTurn.innerText='';
        opponentId=undefined;
    }
    else if(isDraw()){
        playingWith.innerText="Match Draw";
        whoseTurn.innerText='';
        socket.emit('Match_draw',{currentCell:e.target.id, opponentId:opponentId});
    }
    else{
    socket.emit('yourTurn',{currentCell: e.target.id ,opponentId:opponentId})
    }
}

function placeMark(cell,currentClass) {
    cell.classList.add(currentClass);
}

function checkWin(currentClass) {
    return WINNING_COMBINATIONS.some(combination =>{
        return combination.every(index =>{
            return cellElements[index].classList.contains(currentClass)
        })
    })
}

function isDraw(){
    return [...cellElements].every(cell=>{
        return cell.classList.contains(X_CLASS) ||
        cell.classList.contains(CIRCLE_CLASS)
    })
}

function reset() {
    cellElements.forEach((cell)=>{
        cell.classList.remove(X_CLASS);
        cell.classList.remove(CIRCLE_CLASS);
        cell.removeEventListener('click',handleClick);
    })
    playingWith.innerText=""
    whoseTurn.innerText='';
    usersListShow.selectedIndex=-1;
}