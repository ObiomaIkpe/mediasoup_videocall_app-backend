const config = require("../config/config");

class Client {
    constructor(userName, socket){
        this.userName = userName;
        this.socket = socket;

        this.upstreamTransport = null
        //this producer will just have two parts, an audio and a video producer
        this.producer = {}

        this.downstreamTransports = []
        this.consumers = []

        this.room = null
    }
    addTransport(type) {
    return new Promise(async (resolve, reject) => {     
        const {listenIps, initialAvailableOutgoingBitrate, maxIncomingBitrate} = config.webRtcTransport; 
    const transport = await this.room.router.createWebRtcTransport({
        enableUdp: true,
        enableTcp: true, //always use UDP unless we can't
        preferUdp: true,
        listenInfos:listenIps,
        initialAvailableOutgoingBitrate,
    })

    if(maxIncomingBitrate){
        try {
            await transport.setMaxIncomingBitrate(maxIncomingBitrate)            
        } catch (error) {
            console.log("error setting max incoming bitrate")
        }
    }


    // console.log(transport)
    const clientTransportParams = {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
    }

    if(type === "producer"){
        //set the new transport to the client's upstream transport
        this.upstreamTransport = transport
    }else if (type === "consumer"){
        this.downstreamTransports.push(transport)
    }
    resolve(clientTransportParams)
    })
}
}

module.exports = Client;