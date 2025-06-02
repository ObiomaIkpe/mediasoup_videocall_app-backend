const http = require('http') 
const express = require('express')
const app = express()
const httpServer = http.createServer(app)

const socketio = require('socket.io')
const mediasoup = require('mediasoup')

const config = require('./config/config')
const createWorkers = require('./utilities/createWorkers')
const Client = require('./Classes/Client')
const Room = require('./Classes/Room')
const getWorker = require('./utilities/getWorker')


const io = socketio(httpServer,{
    cors: [`http://localhost:5173`],
})

let workers = null

const rooms = []

const initMediasoup = async () => {
    workers = await createWorkers()
}


initMediasoup()

io.on('connect', socket => {
    let client;
    const handshake = socket.handshake;

    socket.on('joinRoom', async ({userName, roomName}, ackCb) => {
        let newRoom = false
        client = new Client(userName, socket)

        let requestedRoom = rooms.find(room => room.roomName ===roomName)

        if(!requestedRoom) {
            newRoom = true
            const workerToUse = await getWorker(workers)
            requestedRoom = new Room(roomName, workerToUse)
            await requestedRoom.createRouter()
            rooms.push(requestedRoom)
        }
        //add the room to the client.
        client.room = requestedRoom
        //add the client to the room clients
        client.room.addClient(client)
        //add this socket to the socket room
        socket.join(client.room.roomName)

        ackCb({
            routerRtpCapablities: client.room.router.rtpCapabilities,
            newRoom
        })


        socket.on('requestTransport', async({type}, ackCb) => {
            let clientTransportParams;

            if(type === "producer"){
                //run addClient, which is part of our client class
            clientTransportParams = await client.addTransport(type)
            } else if(type === "consumer") {}
            
            ackCb(clientTransportParams)
        })

        socket.on('connectTransport', async ({dtlsParameters, type}, ackCb) => {
            if(type === "producer"){
                try {
                    await client.upstreamTransport.connect({dtlsParameters})
                    ackCb("success")
                } catch (error) {
                    console.log(error)
                    ackCb("error")
                }
            } else if (type === "consumer"){

            }
        })
        socket.on('startProducing', async({kind, rtpParameters}, ackCb) => {
            //create a producer with rtpParameters we were sent
            try {
                    const newProducer = await client.upstreamTransport.produce({kind, rtpParameters})
                    ackCb(newProducer.id)
                    
                } catch (error) {
                    console.log(error)
                    ackCb("error")
                }
    })

//joinRoom event curly brace and bracket
})



    
})




httpServer.listen(config.port)
