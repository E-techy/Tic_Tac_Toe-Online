
const socket=io('http://localhost:5500');
socket.on('connect',()=>{
    console.log('connected to server');
})