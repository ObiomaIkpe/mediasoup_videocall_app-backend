
const getPublicIp = require('../utilities/findMyIP');

let publicIp = null;

const publicIP = async ()  => {
  
  try {
    publicIp = await getPublicIp();
    if (!publicIp || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(publicIp)) {
      throw new Error('Invalid IP address received from external service.');
    }
    console.log(`Public IP address: ${publicIp}`);
  } catch (error) {
    console.log("error")
  }
}

publicIP();

const config = {
    port: process.env.PORT || 3031,
    // port: 3031,
    workerSettings: {
        //rtcMinPort and max are just arbitray ports for our traffic
        //useful for firewall or networking rules
        rtcMinPort: 40000,
        rtcMaxPort: 41000,
        //log levels you want to set
        logLevel: 'warn',
        logTags: [
            'info',
            'ice',
            'dtls',
            'rtp',
            'srtp',
            'rtcp',
            'rtx',
    'bwe',
    'score',
    'simulcast',
    'svc'            
        ]
    },
    routerMediaCodecs: [
        {
          kind        : "audio",
          mimeType    : "audio/opus",
          clockRate   : 48000,
          channels    : 2
        },
        {
          kind       : "video",
          mimeType   : "video/H264",
          clockRate  : 90000,
          parameters :
          {
            "packetization-mode"      : 1,
            "profile-level-id"        : "42e01f",
            "level-asymmetry-allowed" : 1
          }
        },
        {
            kind       : "video",
            mimeType   : "video/VP8",
            clockRate  : 90000,
            parameters : {}
          }        
    ],
    webRtcTransport: {
      listenIps: [
        {
          // ip: '127.0.0.1', //localhost
          ip: '0.0.0.0',
          announcedIp: '52.27.98.238'
          // announcedIp: null
        }
      ],
      //For a typical video stream with HD quality, you might set maxIncomingBitrate 
      //around 5 Mbps (5000 kbps) to balance quality and bandwidth.
      //4K Ultra HD: 15 Mbps to 25 Mbps
      maxIncomingBitrate: 5000000, // 5 Mbps, default is INF
      initialAvailableOutgoingBitrate: 5000000 // 5 Mbps, default is 600000
    },
}

module.exports = config