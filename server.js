const http = require('http') 
const express = require('express')
require('dotenv').config()
const app = express()
const httpServer = http.createServer(app)

const socketio = require('socket.io')
const mediasoup = require('mediasoup')

const config = require('./config/config')
const createWorkers = require('./utilities/createWorkers')
const Client = require('./Classes/Client')
const Room = require('./Classes/Room')
const getWorker = require('./utilities/getWorker')
const updateActiveSpeakers = require('./utilities/updateActiveSpeakers')


const io = socketio(httpServer,{
    cors:{
         origin: ['https://mediasoup-videocall-app-frontend.onrender.com',
            // 'http://localhost:5173'
         ],
         methods: ["GET", "POST"],
         credentials: true
    }
})

let workers = null

const rooms = []

const initMediasoup = async () => {
    workers = await createWorkers()
}


initMediasoup()

app.get('/', (req, res) => {
    res.status(200).send('server is up!!')
})

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
            await requestedRoom.createRouter(io)
            rooms.push(requestedRoom)
        }
        //add the room to the client.
        client.room = requestedRoom
        //add the client to the room clients
        client.room.addClient(client)
        //add this socket to the socket room
        socket.join(client.room.roomName)

        //creating audio pids
        //fetch the first 5 active speaker pidss in active speaker list
        const audioPidsToCreate = client.room.activeSpeakerList.slice(0,5)
        const videoPidsToCreate = audioPidsToCreate.map(aid => {
            const producingClient = client.room.clients.find(c => c?.producer?.audio?.id === aid)
            return producingClient?.producer?.video?.id
        })

        const associatedUserNames = audioPidsToCreate.map(aid => {
            const producingClient = client.room.clients.find(c => c?.producer?.audio?.id === aid)
            return producingClient?.userName
        })

        ackCb({
            routerRtpCapablities: client.room.router.rtpCapabilities,
            newRoom,
            audioPidsToCreate,
            videoPidsToCreate,
            associatedUserNames
        })


        socket.on('requestTransport', async({type, audioPid}, ackCb) => {
            let clientTransportParams;

            if(type === "producer"){
                //run addClient, which is part of our client class
            clientTransportParams = await client.addTransport(type)
            } else if(type === "consumer") {
                const producingClient = client.room.clients.find(c=> c?.producer?.audio?.id === audioPid)
                const videoPid = producingClient?.producer?.video?.id

                clientTransportParams = await client.addTransport(type, audioPid, videoPid)

            }
            
            ackCb(clientTransportParams)
        })

        socket.on('connectTransport', async ({dtlsParameters, type, audioPid}, ackCb) => {
            if(type === "producer"){
                try {
                    await client.upstreamTransport.connect({dtlsParameters})
                    ackCb("success")
                } catch (error) {
                    console.log(error)
                    ackCb("error")
                }
            } else if (type === "consumer"){
                try 
        {
            //find the right transport for this consumer
        const downstreamTransport = client.downstreamTransports.find(t => {
                    return t.associatedAudioPid === audioPid
                })                
                downstreamTransport.transport.connect({dtlsParameters})
                    ackCb("success")
                } catch (error) {
                    console.log(error)
                    ackCb("error")
                }
            }
        })
        socket.on('startProducing', async({kind, rtpParameters}, ackCb) => {
            //create a producer with rtpParameters we were sent
            try {
                    const newProducer = await client.upstreamTransport.produce({kind, rtpParameters})

                    client.addProducer(kind, newProducer)
                    if (kind === "audio"){
                        client.room.activeSpeakerList.push(newProducer.id)
                    }
                    ackCb(newProducer.id)
                    
                } catch (error) {
                    console.log(error)
                    ackCb(error)
                }
        //run update active speakers
        const newTransportsByPeer = updateActiveSpeakers(client.room, io)

        for(const [socketId, audioPidsToCreate] of Object.entries(newTransportsByPeer)){
            //we have the audio pids that this socket needs to create
            const videoPidsToCreate = audioPidsToCreate.map(aPid => {
                const producerClient = client.room.clients.find(c => c?.producer?.audio?.id === aPid)
                return producerClient?.producer?.video?.id
        })

        const associatedUserNames = audioPidsToCreate.map(aPid => {
                const producerClient = client.room.clients.find(c => c?.producer?.audio?.id === aPid)
                return producerClient?.userName
        })
        io.to(socketId).emit('newProducersToConsume', {
            routerRtpCapablities: client.room.router.rtpCapabilities,
            newRoom,
            audioPidsToCreate,
            videoPidsToCreate,
            associatedUserNames,
            activeSpeakerList: client.room.activeSpeakerList.slice(0,5)
        })
        }
    })
              
    
socket.on('audioChange', typeOfChange => {
        if(typeOfChange === "mute"){
            client?.producer?.audio?.pause()
        } else {
            client?.producer?.audio?.resume()
        }
    })

    socket.on('consumeMedia', async ({rtpCapabilities, pid, kind}, ackCb) => {
        //will run twice for every peer to be consumed. one for video, and the second one for audio
        console.log("kind:", kind, "pid:", pid)
        try {
        if(!client.room.router.canConsume({producerId:pid, rtpCapabilities}))
            {
                ackCb("cannotConsume")
            } else {
                //we can consume this media
                const downstreamTransport = client.downstreamTransports.find(t => {
                    if(kind === "audio"){
                        return t.associatedAudioPid === pid
                    } else if (kind === "video"){
                        return t.associatedVideoPid === pid
                    }
                })
                //create the consumer with the transport
                const newConsumer = await downstreamTransport.transport.consume({
                    producerId: pid,
                    rtpCapabilities, 
                    paused: true
                })
                client.addConsumer(kind, newConsumer, downstreamTransport)

                const clientParams = {
                    producerId: pid,
                    id: newConsumer.id,
                    kind: newConsumer.kind,
                    rtpParameters: newConsumer.rtpParameters,
                }
                ackCb(clientParams)
            }
        } catch (error) {
            console.log("error consuming media", error)
            ackCb("consumeFailed")
        }
    
})

    socket.on('unpauseConsumer', async({pid, kind}, ackCb) => {
        const consumerToResume = client.downstreamTransports.find(t => {
            return t?.[kind].producerId === pid
        })
        await consumerToResume[kind].resume()
        ackCb()    
    })

//joinRoom event curly brace and bracket
})

})


httpServer.listen(config.port)

    



