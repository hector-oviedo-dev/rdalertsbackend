var port = 777;
var socketport = 666;

//require libs
var net = require('net');
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var cors = require('cors');
var mongo = require('mongodb');
var admin = require("firebase-admin");
var app = express();

var socket;
var clients = [];

var serviceAccount = require("./danieriraul-be936-firebase-adminsdk-ixp6j-4f79fac27f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://danieriraul-be936.firebaseio.com"
});

//start the server
var init = function() {

	app.use(cors());

	//SOCKET
	net.createServer(function (socket) {
		//ADD CLIENT
		clients.push(socket);
		//console.log("TRYING TO CONNECT " + socket.remoteAddress,socket.remotePort);
		
		//READ PACKAGE
		socket.on('data', function (data) {
			console.log("PACKAGE: " + data);
			
			var arr = data.toString().split("|");
			
			var length = arr[0];
			var command = arr[1];
			var deviceID = arr[2];
			var sensorID = arr[3];
			var msg = arr[4];
			
			sendMsg(deviceID, msg);
		});
		
		//READ ERROR
		socket.on('error', function (data) {
			console.log(socket.remoteAddress+":"+socket.remotePort,"SOCKET error:",data);
			clients.splice(clients.indexOf(socket), 1);
			socket.destroy();
		});

		//REMOVE CLIENT
		socket.on('end', function () {
			clients.splice(clients.indexOf(socket), 1);
			//console.log("LEFT: " + socket.remoteAddress,socket.remotePort);
		});
		
		//console.log("ACCEPTED: " + socket.remoteAddress,socket.remotePort);
		
	}).listen(socketport);
	
	//body parser
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: false}));
	
	//services
	var updateToken = require('./services/updatetoken');
	app.use('/', updateToken);
	
	//add/update device
	var updateDevice = require('./services/updatedevice');
	app.use('/', updateDevice);
	
	//return notifications
	var getNotifications = require('./services/getnotifications');
	app.use('/', getNotifications);
	
	//notification check
	var checkNotification = require('./services/checknotification');
	app.use('/', checkNotification);
	
	//start HTTP server
	http.createServer(app).listen(port, function() { console.log('Server HTTPS Started at port ' + port); });
}

init();

var sendMsg = function(device, str) {
	const MongoClient = mongo.MongoClient;
	const MongoURL = 'mongodb://admin:1234@ds141889.mlab.com:41889/rdalerts';
	var db = MongoClient.connect(MongoURL, function(err, db) {
		if (err) console.log("error MONGO CONNECTION: " + err);
		else {
			var devices = db.collection("devices");
			devices.findOne({'DEVICEID':device}, function (err, result) {
				if (err) { console.log("error: " + err); }
				else {
					if (result) {
						
						var notification = {
								"NAME":result.NAME,
								"DESC":result.DESC,
								"DEVICEID":result.DEVICEID,
								"TIME":new Date(),
								"UIDs":result.UIDs
							}
							db.collection("notifications").insertOne(notification, function (err, response) {
								if (err) console.log("Error Adding: " + err);
							});
							
						startProcess(db, result, 0);
					}
					else console.log("DEVICE",device,"NOT IN DATABASE");
				}
			});
		}
	});
};

//send message to FirebaseCloudMessaging
var startProcess = function(db, device, step) {
	if (device.UIDs.length > step) checkUser(db, device, step);
	else {
		console.log("ENDED LOOP OF UIDs");
		try { db.close(); } catch (e) {console.log(e) }
	}
}
var checkUser = function(db, device, step) {
	var users = db.collection("users");
	users.findOne({'UID':device.UIDs[step]}, function (err, result) {
		if (err) console.log("error: " + err);
		else {
			if (result) sendToSingle(db, device, result, step);
			else {
				console.log("UID NOT found, going to next one.");
				startProcess(db, device, step+1);
			}
		}
	});
}
var sendToSingle = function(db, device,user, step) {
	var message = {
	  android: {
		ttl: 60 * 1000,
		priority: 'high',
		notification: {
		  title: device.NAME,
		  body: device.DESC,
		  icon: 'stock_ticker_update',
		  color: '#f45342'
		}
	  },
	  token: user.TOKEN
	};
	
	admin.messaging().send(message)
	  .then((response) => {
		// Response is a message ID string.
		console.log('MESSAGE SENT STEP:',step,'UID:',device.UIDs[step]);
		
		var notification = {
			"UID":device.UIDs[step],
			"NAME":device.NAME,
			"DESC":device.DESC,
			"DEVICEID":device.DEVICEID,
			"TIME":new Date(),
			"CHECKED":false
		}
		db.collection("notificationsSent").insertOne(notification, function (err, response) {
			if (err) console.log("Error Adding: " + err);
			else startProcess(db, device, step+1);
		});
	  })
	  .catch((error) => {
		console.log('ERROR STEP:',step,'UID:',device.UIDs[step],'Firebase (this UID is possible disconnected)');
		startProcess(db, device, step+1);
	  });
}