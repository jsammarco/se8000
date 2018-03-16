var weather = require('weather-js'),
	request = require('request');


exports.index = function(req, res){
	res.render('index');
};

exports.weatherData = function(req, res){
	var zip = req.query.zip,
		unit = req.query.unit;
	if (!zip || !zip.length || !unit || unit === "") { res.send(404); return console.log("No zip or unit provided"); }
	console.log("Looking up weather for ", zip, unit);
	weather.find({search: zip, degreeType: unit}, function(err, result) {
		var data = JSON.stringify(result, null, 2),
			forecast = {},
			current = {},
			location = "",
			img = "",
			condition = "",
			temp = "",
			humidity = "";
		if(err) { res.send(404); return console.log(err); }
		//console.log(result);
		data = result;
		if(!data.length) { res.send(404); return console.log("No data"); }
		current = data[0].current;
		forecast = data[0].forecast;
		location = data[0].location.name;
		if (!current) { res.send(404); return console.log("No current data"); }
		img = current.imageUrl;
		condition = current.skytext;
		temp = current.temperature;
		humidity = current.humidity;
		console.log(temp, humidity, img, condition);
		res.send({location: location, temp: temp, humidity: humidity, img: img, condition: condition, forecast: forecast});
	});
}

exports.indoorData = function(req, res){
	var options = {
	  uri: 'http://10.0.1.36/',
	  method: 'GET'
	};
	request(options, function (error, response, data) {
		if (!error && response.statusCode == 200) {
			data = JSON.parse(data);
			var c_temp = data.c,
				f_temp = data.f,
				hum = data.h;
			console.log("Indoor: "+c_temp+" C", f_temp+" F "+hum+"% RH");
			res.send({
				c: c_temp,
				f: f_temp,
				h: hum
			});
		}else{
			res.send(404);
		}
	});
};