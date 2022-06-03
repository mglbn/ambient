const screen = require('screenshot-desktop');
const colorApi = require('fast-average-color-node');
const net = require('net');

const lamps = ['192.168.178.62','192.168.178.45','192.168.178.44'];



function getAvgColor(){

    return screen.listDisplays().then( (displays)=>{

        return screen({screen: displays[0].id, format: 'png'}).then( (pngBuffer) => {

            return colorApi.getAverageColor(pngBuffer).then( (avgColor)=>{
                
                return avgColor;
            });
            
        });

    });

};

function getSockets(lamps){
    var res =[];
    for (const lamp of lamps){
        console.log(lamp)
        var socket = new net.Socket();
        socket.connect(55443,lamp);
        res.push(socket);
    };
    return res;
};

function adjustColorDumb(color){
    var res= {value: []};
    var rgbValues = [color.value[0],color.value[1],color.value[2]];
    console.log(rgbValues);
    const max = Math.max(...rgbValues);
    const maxIndex = rgbValues.indexOf(max);
    for (var i=0; i < 3; i++){
        switch (Math.floor(rgbValues[i]/85)){
            case 0: 
                rgbValues[i] = 0;
                break;
            case 1:
                rgbValues[i]=127;
                break;
            default:
                rgbValues[i]=255;
        }
    }
    rgbValues[maxIndex]=255;
    res.value = rgbValues;
    return res;
};

async function refresh(sockets){
    var color = await getAvgColor();
    color = adjustColorDumb(color);
    console.log(color);
    var decColor = 65536*color.value[0]+ 256*color.value[1]+ color.value[2];
    for (const socket of sockets){
        socket.write('{"id":1,"method":"set_scene", "params": ["color", ' +decColor+', 100]}\r\n');
    };
};



//the fun part (: ...

var sockets = getSockets(lamps);

process.on('SIGINT', ()=>{
    sockets.forEach((socket) => socket.destroy());
    console.log('alle Sockets wurden zerstört');
    process.exit();
});

setInterval(() => refresh(sockets),1000);



