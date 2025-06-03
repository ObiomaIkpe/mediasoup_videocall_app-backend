const config = require("../config/config")
const newDominantSpeaker = require("../utilities/newDominantSpeaker")

class Room {
    constructor(roomName, workerToUse){
        this.roomName = roomName
        this.worker = workerToUse

        this.router = null

        this.clients = []

        this.activeSpeakerList = []
    }
    addClient(client){
        this.clients.push(client)
    }
    createRouter(io) {
        return new Promise(async(resolve, reject) => {
            this.router = await this.worker.createRouter({
            mediaCodecs: config.routerMediaCodecs
        })
        this.activeSpeakerObserver = await this.router.createActiveSpeakerObserver({
            interval: 300
        })      
        this.activeSpeakerObserver.on('dominantspeaker', ds => newDominantSpeaker(ds, this, io))            
             resolve()
    })
}



}

module.exports = Room;