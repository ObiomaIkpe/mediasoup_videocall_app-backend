

const updateActiveSpeakers = (room, io) => {
    const activeSpeakers = room.activeSpeakerList.slice(0, 5)
    const mutedSpeakers = room.activeSpeakerList.slice(5)

    const newTransportsByPeer = {}

    room.clients.forEach(client => {
        mutedSpeakers.forEach(pid => {
            if(client?.producer?.audio?.id === pid){
                client?.producer?.audio.pause()
                client?.producer?.video.pause()
                return
            }
            const downstreamToStop = client.downstreamTransports.find(t => {
                t?.audio?.producerId === pid
            })
            if(downstreamTransport){
                downstreamToStop.audio.pause()
                downstreamToStop.video.pause()
            }
        })
        const newSpeakersToThisClient = []
        activeSpeakers.forEach(pid => {
            if(client?.producer?.audio?.id === pid){
                client?.producer?.audio.resume()
                client?.producer?.video.resume()
                return
            }
            const downstreamToStart = client.downstreamTransports.find(t => 
                t?.associatedAudioPid === pid) 
            
                if(downstreamToStart){
                    downstreamToStart?.audio.resume()
                    downstreamToStart?.video.resume()
                }else {
                    newSpeakersToThisClient.push(pid)
                }
        })
        if(newSpeakersToThisClient.length > 0){
            newTransportsByPeer[client.socket.id] = newSpeakersToThisClient
        }
    })
    io.to(room.roomName).emit('updateActiveSpeakers', activeSpeakers)
    return newTransportsByPeer
}

module.exports = updateActiveSpeakers