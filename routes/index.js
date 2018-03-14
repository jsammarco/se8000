var weather = require('weather-js');


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
};