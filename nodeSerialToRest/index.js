/*
	serialToRest
	a node.js app to read take requests and reply with serial data
	requires:
		* node.js (http://nodejs.org/)
		* servi.js (https://github.com/antiboredom/servi.js)
		* serialport.js (https://github.com/voodootikigod/node-serialport)
		
				
	created 5 Nov 2012
	modified 21 Oct 2014
	by Tom Igoe
	
	Mark was here...
	
*/

var serialport = require("serialport"),		// include the serialport library
	SerialPort  = serialport.SerialPort,	   // make a local instance of serial
	servi = require('servi'),						// include the servi library
	app = new servi(false);							// servi instance

// configure the server's behavior:
app.port(8080);						// port number to run the server on
app.serveFiles("public");			// serve all static HTML files from /public
// respond to calls for the index page:
app.route('/', sendIndexPage);
app.route('/imu_client', sendClientPage);
// take anything that begins with /output:
app.route('/analog/:channel', getAnalogReading);
app.route('/imu/:actionz', getIMUReading);

/*
// catch 404 and forward to error handler.... JJH
app.use(function(req, res, next) {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Headers', 'Content-Type,Content-Length');
	next();
});
*/

// now that everything is configured, start the server:
app.start();	
console.log("Listening for new clients on port 8080");

// the third word of the command line command is serial port name:
var portName = process.argv[2];				  
// print out the port you're listening on:
console.log("opening serial port: " + portName);	

// open the serial port. Uses the command line parameter:
var myPort = new SerialPort(portName, { 
	baudRate: 9600,
	// look for return and newline at the end of each data packet:
	parser: serialport.parsers.readline("\r\n")
//	parser: serialport.parsers.readline("\n")
});


/* The rest of the functions are event-driven. 
   They only get called when the server gets incoming GET requests:
*/

// this function responds to a GET request with the index page:
function sendIndexPage(request) {
  request.serveFile('/imu_client.html');
}

function sendClientPage(request) {
	request.serveFile('public/imu_ws_client.html');
}

// get an analog reading from the serial port:
function getAnalogReading(request) {
	// the parameter after /analog/ is the channel number:
	var channel = request.params.channel;  
	console.log("getting channel: "+ channel + "...");
	
	// send it out the serial port and wait for a response:
	myPort.write(channel, function() {		
		// when you get a response from the serial port, write it out to the client: 
		myPort.on('data', function(data) {
			// send the data and close the connection:
			console.log("channel data returned["+ data + "]");
			request.respond(data);
		});    
	}); 
}

// get an analog reading from the serial port:
function getIMUReading(request) {
	var imuMock = {
		"az": "1.2345",
		"daz": "1.2345",
		"al": "1.2345",
		"dal": "1.2345",
	}

	// the parameter after /analog/ is the channel number:
	var actionz = request.params.actionz;
	console.log("getting actionz: "+ actionz + "...");

	// send it out the serial port and wait for a response:
	myPort.write(actionz, function() {
		// when you get a response from the serial port, write it out to the client:
		myPort.on('data', function(data) {
			// send the data and close the connection:
			console.log("imu data returned to server["+ data + "]");

			var arr = data.split(",");
			imuMock.az = arr[0] ;
			imuMock.daz = arr[1] ;
			imuMock.al = arr[2] ;
			imuMock.dal = arr[3] ;

			request.respond(JSON.stringify(imuMock));
		});
	});
}
