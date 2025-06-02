const config = require("../config/config")

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
    createRouter() {
        return new Promise(async(resolve, reject) => {
            this.router = await this.worker.createRouter({
            mediaCodecs: config.routerMediaCodecs
        })
        resolve()
    })
}



}

module.exports = Room;