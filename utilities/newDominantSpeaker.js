const updateActiveSpeakers = require("./updateActiveSpeakers")

function newDominantSpeaker (ds, room, io) {
    console.log("=======New Dominant Speaker=======", ds.producer.id)
    // console.log(ds)

    const i = room.activeSpeakerList.findIndex(pid => pid === ds.producer.id)
    if(i > -1){
        const [pid] = room.activeSpeakerList.splice(i, 1)
        room.activeSpeakerList.unshift(pid)

    }else{
        //this is a new producer, just add to the front
        room.activeSpeakerList.unshift(ds.producer.id)
    }
    console.log(room.activeSpeakerList)

    const newTransportsByPeer = updateActiveSpeakers(room, io)

     for(const [socketId, audioPidsToCreate] of Object.entries(newTransportsByPeer)){
            const videoPidsToCreate = audioPidsToCreate.map(aPid => {
                const producerClient = room.clients.find(c => c?.producer?.audio?.id === aPid)
                return producerClient?.producer?.video?.id
        })

        const associatedUserNames = audioPidsToCreate.map(aPid => {
                const producerClient = room.clients.find(c => c?.producer?.audio?.id === aPid)
                return producerClient?.userName
        })
        io.to(socketId).emit('newProducersToConsume', {
            routerRtpCapablities: room.router.rtpCapabilities,
            newRoom,
            audioPidsToCreate,
            videoPidsToCreate,
            associatedUserNames,
            activeSpeakerList: room.activeSpeakerList.slice(0,5)
        })
        }
    
}

module.exports = newDominantSpeaker