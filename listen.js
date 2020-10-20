const http = require('http')

var bonjour = require('bonjour')(
    {
        multicast: true, // use udp multicasting
        port: 5353, // set the udp port
        ip: '224.0.0.251', // set the udp ip
        ttl: 255, // set the multicast ttl
        loopback: true, // receive your own packets
        reuseAddr: true // set the reuseAddr option when creating the socket (requires node >=0.11.13)
    }
)

async function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}


var browserMap = new Map();

var handleUp = async function (service) {
    var data = JSON.stringify(service, null, '  ');
    var options = {
        hostname: '192.168.9.230',
        port: 8080,
        path: '/publish',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    }
    const req = http.request(options, (res) => {

        res.on('data', (d) => {
        })
    })
    req.on('error', (error) => {
        console.error(error)
    })
    
    req.write(data)
    req.end()
    console.log("Sent: " + service.type + "," + service.name)
    this._serviceMap = {};
    this.services = [];
    await sleep(900000);
    this.update();
    
}

var types = ['googlecast', 'googlerpc', 'acecast', 'acestreamcast', 'spotify-connect' , 'androidtvremote', 'nv_shield_remote' ];
types.forEach(function (arrayItem) {
    browserMap.set(arrayItem, bonjour.find({ type: arrayItem }, handleUp));

});

 
