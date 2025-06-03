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
}

module.exports = newDominantSpeaker