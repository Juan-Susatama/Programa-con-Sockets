import express from 'express';
import logger from 'morgan';
import http from "http";
import { Server as WebSocketServer} from 'socket.io';
import { ethernetIP, ethernet2IP} from './IPs.js';
import readline from "readline";
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});
const port = 3000;
const app = express();
const server = ethernetIP() || ethernet2IP();
const httpServer = http.createServer(app);
const io = new WebSocketServer(httpServer);
const socketsList = [] 

io.on("connection", (socket) => {
    console.log(`Usuario conectado = ${socket.handshake.address}`);
    // se crea una variable para conocer el tamaño de la lista (socketsList)
    let index = socketsList.findIndex((s) => s.handshake.address === socket.handshake.address );
    //Con este if se busca evitar ue se conecte el mismo usuario 2 veces o mas
	if (index === -1) {socketsList.push(socket);} 
	else {socketsList[index] = socket;}

    socket.emit("socketData", {
        ip: socket.handshake.address,
        port: port,
        rol: socket.handshake.address == server ? "Servidor" : "Cliente",
    })

    socket.on("message", (data) =>{
        console.log(`Este es el server : ${server}`);
        let servidor = socketsList.find((s) => s.handshake.address == server);
        if(socket.handshake.address == server){
			socketsList.forEach((c) => {
				if(c.handshake.address != server){
					c.emit("messageServer",data.message);
					console.log(`Mensaje Enviado a: `,c.handshake.address)
				}
			});
		}else{
			console.log(`Mensaje en buzon\n${data.message}`);
			servidor.handshake.address?servidor.emit("messageServer",data.message):console.log('Servidor no encontrado');
			console.log(`Mensaje Enviado a: `,servidor.handshake.address)
		}
    });

    socket.on('disconnect', () =>{
        console.log('Usuario desconectado');
    });

    rl.on("line", (input) => {
		if (socket.handshake.address != server && input != "") {
			socket.emit("messageServer",input);
		}
	});
});

app.use(logger('dev'));

app.use(express.static('src/public'));


//app.get('/', (req,res) => {
//    res.sendFile(process.cwd() + '/src/public/index.html')
//})

//server.listen(port, () => {
//    console.log(`Server corriendo en el puerto ${port}`)
//});

httpServer.listen(port, server, () => {
    console.log(`Ruta = ${server}:${port}`)
})