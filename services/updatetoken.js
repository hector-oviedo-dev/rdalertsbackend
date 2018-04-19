var mongo = require('mongodb');
var express = require('express');
var router = express.Router();

const MongoClient = mongo.MongoClient;
const MongoURL = 'mongodb://admin:1234@ds141889.mlab.com:41889/rdalerts';


router.post('/updatetoken', function(req, res, next) {
	var uid = req.body.uid;
	var token = req.body.token;
	
	if (!uid || uid == "undefined" || uid == "null" || uid == ""
	|| !token || token == "undefined" || token == "null" || token == "") {
		res.json({"success":"error","errorMessage":"Error Invalid Data"});
	} else {
		var db = MongoClient.connect(MongoURL, function(err, db) {
			if (err) console.log("error MONGO CONNECTION: " + err);
			else {
				var users = db.collection("users");
				users.findOne({'UID':uid}, function (err, duplicateResult) {
					if (err) res.json({"success":"error","errorMessage":"Error: " +  err});
					else {
						if (duplicateResult) {
							duplicateResult.token = token;
							users.save(duplicateResult);
							console.log("TOKEN UPDATED",token)
							res.json({"success":"ok","devices":duplicateResult.UID,"type":"update"});
						} else {
							var data = {
								"UID":uid,
								"TOKEN":token,
								"DEVICEs":[]
							}
							users.insertOne(data, function (err, response) {
								if (err) res.json({"success":"error","errorMessage":"Error Adding: " + err});
								else res.json({"success":"ok","uid":uid,"type":"add"});
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