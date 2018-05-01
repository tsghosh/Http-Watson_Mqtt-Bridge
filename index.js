const http = require('http');
const IotfLib = require("ibmiotf");

let client;
let DEBUG_LEVEL = 'info';

var client_options= {
    "id":"Watson-IoTP-PoC-Client",
    "iotCredentialsIdentifier": 'Watson-IoTP-PoC-Client',
    "mqtt_host": 'xx.messaging.internetofthings.ibmcloud.com',// replace xx with Watson IoTP Organization id
    "mqtt_u_port": 1883,
    "mqtt_s_port": 88832,
    "http_host": 'xx.internetofthings.ibmcloud.com', // replace xx with Watson IoTP Organization id
    "org": 'xx', // replace xx with Watson IoTP Organization id
    "auth-key": 'xx', //add api key
    "auth-token": 'yy' //add api token
}


var get_iotp_client = function(){

    client = new IotfLib.IotfApplication(client_options);
    client.log.setLevel(DEBUG_LEVEL);
    client.connect();
 
    client.on('connect', () => { 
        console.log("Watson-IoTP-PoC-Client connected to IoTP ");
    });
    
    client.on("error", (err) => {
        console.log("Watson-IoTP-PoC-Client Error in : " + err);
    });
    
    client.on("disconnect", () => {
        console.log("Watson-IoTP-PoC-Client disconnected (IoTP)");
    });
}


var server = http.createServer();
server.on('request',(request, response) => {
    const { headers, method, url } = request;
    if(method == "POST"){
        var body = '';
        request.on('data', function (data) {
            body += data;
//            console.log("Partial body: " + body);
        });
        request.on('end',  () => {
            console.log("Body: " + body);
            let deviceid = headers["deviceid"];
            let devicetype = headers["devicetype"];
            let event = headers["event"];
            let format = headers["format"];
            let qos = headers["qos"];
            let data = {}
            try{
                data = JSON.parse(body);
            }catch(err){
                data = body;
            }
            if(!deviceid || !devicetype || !event || !format || !qos || !data){
                response.statusCode = 412;
                response.end("Precondition Failed,Request deviceid,devicetype,event,format,qos as part of header");
            }else{
                if(client && client.isConnected){
                    client.publishDeviceEvent(devicetype, deviceid, event, format, data,qos);
                    response.statusCode = 200;
                    response.end("Event Published.");
                }else{
                    response.statusCode = 504;
                    response.end("Gateway Timeout, Watson-IoTP-PoC-Client disconnected (IoTP) ");
                }
            }
        });
    }else{
        response.statusCode = 501;
        response.end("Undefined request .");
    }
});

server.listen(5001) ;
get_iotp_client();