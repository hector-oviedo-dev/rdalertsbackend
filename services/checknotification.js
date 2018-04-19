var mongo = require('mongodb');
var express = require('express');
var router = express.Router();

const MongoClient = mongo.MongoClient;
const MongoURL = 'mongodb://admin:1234@ds141889.mlab.com:41889/rdalerts';


router.post('/checknotification', function(req, res, next) {
	var deviceid = req.body.deviceid;
	
	if (!deviceid || deviceid == "undefined" || deviceid == "null" || deviceid == "") res.json({"success":"error","errorMessage":"Error Invalid Data"});
	else {
		var db = MongoClient.connect(MongoURL, function(err, db) {
			if (err) console.log("error MONGO CONNECTION: " + err);
			else {
				var notificationsSent = db.collection("notificationsSent");
				notificationsSent.findOne({'DEVICEID':deviceid}, function (err, result) {
					if (err) res.json({"success":"error","errorMessage":"Error: " +  err});
					else {
						if (result) {
							result.CHECKED = true;
							notificationsSent.save(result);
							res.json({"success":"ok"});
						} else res.json({"success":"error","errorMessage":"Error Adding: " + err});
					}
					db.close();
				});
			}
		});
	}
});

module.exports = router;