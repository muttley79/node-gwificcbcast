const express = require('express');
const app = express();
var http = require('http');
var util = require('util');
var proxy = require("node-tcp-proxy");

var port = 8080;

app.use(express.json());

http.createServer(app).listen(port, () => {
    console.log('Cast rebroardcaster server started at port 8080');
})

var bonjour = require('bonjour')({
    multicast: true, // use udp multicasting
    port: 5353, // set the udp port
    ip: '224.0.0.251', // set the udp ip
    ttl: 255, // set the multicast ttl
});

app.post('/publish', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    var newService = JSON.stringify(req.body, null, '  ');
    newPublish(newService);
    res.end(JSON.stringify({
            status: "OK"
        }));

});

var proxyMap = new Map();
var publishMap = new Map();

var newPublish = function (newService) {
    var service = JSON.parse(newService);
    var address = service.addresses[0];
    var port = service.port;
    var type = service.type;
    var name = service.name;
    console.log("INFO: Service publish request. Type: " + type + ", port: " + port + ", name: " + name + ", address: " + address);
	
	bonjour.publish(service).on('error', function (e) {
                console.log("ERROR: Cannot publish service: " + e.message)
            })
	
    // create socat proxy
    if ((address && port && type && name) && !proxyMap.get(name+'-'+type)) {
		proxyMap.set(name+'-'+type, proxy.createProxy(port,address,port, {quiet: true}));
        if (type == 'googlecast') {
            doNetflixStuff(address);
        }
    } else {
        console.log("ERROR: Some details are missing for service or service already exists: " + name+'-'+type);
    }
}

function doNetflixStuff(targetIp) {
    console.log("INFO: Starting netflix services as well");
    const Server = require('node-ssdp').Server
        const server = new Server({
        location: "http://" + targetIp + ":9080",
        udn: "uuid:NFANDROID2-PRV-SHIELDANDROIDTV-NVIDISHIELD=ANDROID=TV-15895-3D0E6106D52FC44ADD87C755DF5E225BE2BEDD7F4D915148B2F471B530F1CC0C",
        ssdpSig: "Linux/4.9.140-tegra-g5eb7ca7547d4, UPnP/1.0, Portable SDK for UPnP devices/1.6.18",
        headers: {

            "OPT": "\"http://schemas.upnp.org/upnp/1/0/\"; ns=01",
            '01-NLS': "fc0420f0-08d5-11eb-818b-d4c3922d4202",
            "SERVER": "Linux/4.9.140-tegra-g5eb7ca7547d4, UPnP/1.0, Portable SDK for UPnP devices",
            "X-USER-AGENT": "NRDP MDX",
            "X-FRIENDLY-NAME": "TGl2aW5nIFJvb20gVFY=",
            "X-ACCEPTS-REGISTRATION": "3",
            "X-MSL": "1",
            "X-MDX-CAPS": "",
            "X-MDX-REGISTERED": "1",
            "X-MDX-REMOTE-LOGIN-SUPPORTED": "0",
            "X-MDX-REMOTE-LOGIN-REQUESTED-BY-WITCHER": "0"

        }
    });

    server.addUSN('upnp:rootdevice');
    server.addUSN('urn:schemas-upnp-org:device:mdxdevice:1');
    server.addUSN('urn:mdx-netflix-com:service:target:3');
    //server.addUSN('urn:mdx-netflix-com:service:target:1')

    server.start()

    const Server2 = require('node-ssdp').Server
        const server2 = new Server2({
        location: "http://" + targetIp + ":8008/ssdp/device-desc.xml",
        udn: "uuid:74a18069-66f2-40f0-12e8-9991ac01412e",
        ssdpSig: "Linux/4.9.140-tegra-g5eb7ca7547d4, UPnP/1.0, Portable SDK for UPnP devices/1.6.18",
        headers: {
            "OPT": "\"http://schemas.upnp.org/upnp/1/0/\"; ns=01",
            '01-NLS': '261a2f00-0995-11eb-8ba6-a99b90f231e9',
            "X-User-Agent": 'redsonic',
            "BOOTID.UPNP.ORG": 0,
            "CONFIGID.UPNP.ORG": 3
        }
    });
    server2.addUSN('upnp:rootdevice');
    server2.addUSN('urn:dial-multiscreen-org:device:dial:1');
    server2.addUSN('urn:dial-multiscreen-org:service:dial:1');

    server2.start()

}

