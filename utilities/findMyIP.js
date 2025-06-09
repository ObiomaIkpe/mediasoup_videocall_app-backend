const axios = require('axios');

async function getPublicIp() {
    try {
        const response = await axios.get('https://api.ipify.org');
        const publicIp = response.data.trim();
        if (!publicIp || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(publicIp)) {
            throw new Error('Invalid IP address received from external service.');
        }
        console.log(`Public IP address: ${publicIp}`);
        return publicIp;
    } catch (error) {
        console.error('Failed to fetch public IP address:', error.message);
        throw new Error(`Could not determine public IP: ${error.message}`);
    }
}

getPublicIp()

module.exports = getPublicIp;