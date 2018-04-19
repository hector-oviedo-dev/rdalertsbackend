var mongo = require('mongodb');
var express = require('express');
var router = express.Router();

const MongoClient = mongo.MongoClient;
const MongoURL = 'mongodb://admin:1234@ds141889.mlab.com:41889/rdalerts';


router.post('/getnotifications', function(req, res, next) {
	var uid = req.body.uid;
	
	if (!uid || uid == "undefined" || uid == "null" || uid == "") res.json({"success":"error","errorMessage":"Error Invalid Data"});
	else {
		var db = MongoClient.connect(MongoURL, function(err, db) {
			if (err) console.log("error MONGO CONNECTION: " + err);
			else {
				var notificationsSent = db.collection("notificationsSent");
				notificationsSent.find({'UID':uid}).toArray(function (err, result) {
					if (err) res.json({"success":"error","errorMessage":"Error: " +  err});
					else {
						if (result) res.json({"success":"ok","result":result});
						else res.json({"success":"error","errorMessage":"No UID found:",uid});
					}
					db.close();
				});
			}
		});
	}
});

module.exports = router;