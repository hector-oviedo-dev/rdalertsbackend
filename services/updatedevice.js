var mongo = require('mongodb');
var express = require('express');
var router = express.Router();

const MongoClient = mongo.MongoClient;
const MongoURL = 'mongodb://admin:1234@ds141889.mlab.com:41889/rdalerts';


router.post('/updatedevice', function(req, res, next) {
	var uid = req.body.uid;
	var deviceid = req.body.deviceid;
	var name = req.body.name;
	var desc = req.body.desc;
	
	console.log("uid",uid)
	console.log("deviceid",deviceid)
	console.log("name",name)
	console.log("desc",desc)
	
	if (!uid || uid == "undefined" || uid == "null" || uid == ""
	|| !deviceid || deviceid == "undefined" || deviceid == "null" || deviceid == ""
	|| !name || name == "undefined" || name == "null" || name == ""
	|| !desc || desc == "undefined" || desc == "null" || desc == "") {
		res.json({"success":"error","errorMessage":"Error Invalid Data"});
	} else {
	
		var db = MongoClient.connect(MongoURL, function(err, db) {
			if (err) console.log("error MONGO CONNECTION: " + err);
			else {
				var devices = db.collection("devices");
				devices.findOne({'DEVICEID':deviceid}, function (err, duplicateResult) {
					if (err) res.json({"success":"error","errorMessage":"Error: " +  err});
					else {
						if (duplicateResult) {
							var arr = duplicateResult.UIDs;
							
							valid = true;
							for (var  i = 0; i < arr.length; i++) if (arr[i] == uid) valid = false;
							if (valid) duplicateResult.UIDs.push(uid);
							
							duplicateResult.NAME = name;
							duplicateResult.DESC = desc;
							
							devices.save(duplicateResult);
							res.json({"success":"ok","device":duplicateResult.DEVICEID,"type":"update"});
						} else {
							var data = {
								"UIDs":[uid],
								"DEVICEID":deviceid,
								"NAME":name,
								"DESC":desc
							}
							devices.insertOne(data, function (err, response) {
								if (err) res.json({"success":"error","errorMessage":"Error Adding: " + err});
								else res.json({"success":"ok","device":deviceid,"type":"add"});
							});
						}
					}
					db.close();
				});
			}
		});
	}
});

module.exports = router;