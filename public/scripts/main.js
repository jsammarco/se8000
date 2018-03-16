Date.prototype.getMonthName = function() {
    return months[ this.getMonth() ];
};
Date.prototype.getDayName = function() {
    return days[ this.getDay() ];
};

var iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad/),
	iOSApp = window.navigator.standalone == true,
	now = new Date(),
	days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	day = now.getDayName();
	month = now.getMonthName(),
	lastWeather = -1,
	zip = "",
	weatherInterval = null,
	updatingWeather = false,
	mode = "",
	disableFakeTemp = false,
	indoorDataUrl = "";

$(function (){
	$('#today').text(day+" "+month+" "+now.getDate()+", "+now.getFullYear());
	window.scrollTo(0,1);//Hide Android Top Bar
	var indoorTemp = $('.indoorTemp'),
		setpoint = $('.setpoint');
	if (iOSDevice && !iOSApp) {
		$('#hideAddtoHome').parent().show();
	}else{
		document.ontouchmove = function(event){
		    event.preventDefault();
		}
	}
	//setInterval(changeWeather, 15000);
	//changeWeather();
	setTimeout(requestWeather, 500);
	weatherInterval = setInterval(requestWeather, 60000);
	$('#hideAddtoHome').click(function (){
		$(this).parent().hide();
	});
	$('#slider_up').click(function () {
		var current_unit = $('html').hasClass("f") ? "f" : "c";
		$(".selected_slider_icon", this).fadeIn('fast', function(){
			$(this).fadeOut('fast');
		});
		var sp = round5(parseFloat(setpoint.text()));
		if (parseFloat(setpoint.text()) < sp) {
			sp = parseInt(setpoint.text());
		}
		if(current_unit == "c"){
			if (sp >= 25.5) {return false;}
		}else{
			if (sp >= 78) {return false;}
		}
		setpoint.text((sp+0.5).toFixed(1));
	});
	$('#slider_down').click(function () {
		var current_unit = $('html').hasClass("f") ? "f" : "c";
		$(".selected_slider_icon", this).fadeIn('fast', function(){
			$(this).fadeOut('fast');
		});
		var sp = round5(parseFloat(setpoint.text()));
		if (parseFloat(setpoint.text()) > sp) {
			sp = parseInt(setpoint.text());
		}
		if(current_unit == "c"){
			if (sp <= 18.5) {return false;}
		}else{
			if (sp <= 66) {return false;}
		}
		setpoint.text((sp-0.5).toFixed(1));
	});
	$('#heat_cool_btn').click(function(){
		$(".selected_icon", this).fadeToggle(function(){
			//alert("Allow authorized personel to override the heating/cooling mode.");
			$('.heatingcooling').fadeOut(function(){
				if($('.heatingcooling').attr('src') == "images/heat_icon.png"){
					$('.heatingcooling').attr('src', "images/snowflake_icon.png");
				}else{
					$('.heatingcooling').attr('src', "images/heat_icon.png");
				}
				$('.heatingcooling').fadeIn();
			});
		});
	});
	$('#fan_btn').click(function(){
		$(".selected_icon", this).fadeToggle(function(){
			//alert("Allow authorized personel to override the fan.");
			if($('.fanon').hasClass('spin')){
				$('.fanon').removeClass('spin');
			}else{
				$('.fanon').addClass('spin');
			}
		});
	});
	$('#f_c_btn').click(function(){
		if(updatingWeather){ return false; }
		$(".selected_icon", this).fadeToggle(function(){
			if($(this).is(":visible")){
				switchUnits("c");
			}else{
				switchUnits("f");
			}
		});
	});
	$('#en_btn').click(function(){
		$(".selected_icon", this).fadeToggle(function(){
			alert("Allow authorized personel or hotel guests to change the language.\n\nOr hotel room thermostat languages can be set automatically via your booking system through Schneider Electric solutions.");
		});
	});
	$('.vertDivider').click(function(){
		$("#myModal").modal("show");
	});
	$('#question_btn').click(function(){
		var that = this;
		clearInterval(weatherInterval);
		weatherInterval = setInterval(requestWeather, 60000);
		requestWeather(function () {
			$(".selected_icon", that).fadeIn(function (){
				$("#myModal").modal("show");
				setTimeout(function (){
					$('#question_btn .selected_icon').fadeOut();
				}, 1000);
			});
		});
	});
	$('#zip').keypress(function (e){
		var keycode = event.keyCode || event.which;
		if(keycode == 13) {
			e.preventDefault();
	        $('#refresh_btn').click();
		    return false;
	    }
	});
	$('#indoorDataUrl').keypress(function (e){
		var keycode = event.keyCode || event.which;
		if(keycode == 13) {
			e.preventDefault();
	        $('#changeIndoorDataUrl').click();
		    return false;
	    }
	});
	$('#refresh_btn').click(function () {
		var that = $(this);
		that.text("Refreshing");
		clearInterval(weatherInterval);
		weatherInterval = setInterval(requestWeather, 60000);
		requestWeather();
		setTimeout(function () {
			that.text("Updated");
			setTimeout(function () {
				that.text("Refresh");
			}, 1500);
		}, 1500);
	});
	$("#changeIndoorDataUrl").click(function () {
		var that = $(this);
		that.text("Checking");
		clearInterval(weatherInterval);
		weatherInterval = setInterval(requestWeather, 60000);
		requestWeather();
		setTimeout(function () {
			that.text("Updated");
			setTimeout(function () {
				that.text("Update");
			}, 1500);
		}, 1500);
		indoorDataUrl = $('#indoorDataUrl').val();
		createCookie("indoorDataUrl", indoorDataUrl, 365);
		requestWeather(function() {
			setTimeout(function() {
				if(!disableFakeTemp){
					alert("Failed. The device is offline, url is invalid or not a valid JSONP call with data object.");
				}else{
					alert("Success");
				}
			}, 1500);
		});
	});
	$("#toggleSettings").click(function () {
		$("#settingsPanel").slideToggle();
	});

	setInterval(checkmode, 2000);
	setInterval(heatcool, 5000);
	var cookie_zip = readCookie("zip");
	var cookie_indoorDataUrl = readCookie("indoorDataUrl");
	console.log("cookie_zip", cookie_zip);
	console.log("cookie_indoorDataUrl", cookie_indoorDataUrl);
	if (cookie_zip != "" && cookie_zip !== null) {
		zip = cookie_zip;
		$('#zip').val(zip);
	}
	if (cookie_indoorDataUrl != "" && cookie_indoorDataUrl !== null) {
		indoorDataUrl = cookie_indoorDataUrl;
		$('#indoorDataUrl').val(indoorDataUrl);
	}
});

function heatcool() {
	if (disableFakeTemp) { return false; }
	//if (mode == "") { return false; }
	var sp = parseFloat($('.setpoint').text()),
		temp = parseFloat($('.indoorTemp_num').text()),
		ran = parseFloat(Math.abs(Math.floor(Math.random() * 10)/10 -0.7).toFixed(1));
	ran = Math.max(ran, 0.3);
	//console.log(ran);
	if (mode == "heating") {
		$('.indoorTemp_num').text((temp + ran).toFixed(1));
	}else if (mode == "cooling") {
		$('.indoorTemp_num').text((temp - ran).toFixed(1));
	}else{
		$('.indoorTemp_num').text((temp - 0.1).toFixed(1));
	}
}

function heating() {
	//console.log("heating");
	if (mode == "heating") { return false; }
	mode = "heating";
	$('#fan_btn .selected_icon').fadeIn();
	$('#heat_cool_btn .selected_icon').fadeIn();
	if(!$('.fanon').hasClass('spin')){
		$('.fanon').addClass('spin');
	}
	$('.heatingcooling').fadeOut(function(){
		$('.heatingcooling').attr('src', "images/heat_icon.png");
		$('.heatingcooling').fadeIn();
	});
}

function checkmode(){
	if (Math.floor(Math.random() * 4) + 1 > 2) {
		return false;//console.log("Random 1/2 skip checkmode");
	}
	var sp = parseFloat($('.setpoint').text()),
		temp = parseFloat($('.indoorTemp_num').text());
	if (temp > sp + 1) {
		//console.log("Cooling");
		cooling();
	}else if(temp < sp - 1){
		//console.log("Heating");
		heating();
	}else{
		satisfied();
	}
}

function cooling() {
	//console.log("cooling");
	if (mode == "cooling") { return false; }
	mode = "cooling";
	$('#fan_btn .selected_icon').fadeIn();
	$('#heat_cool_btn .selected_icon').fadeIn();
	if(!$('.fanon').hasClass('spin')){
		$('.fanon').addClass('spin');
	}
	$('.heatingcooling').fadeOut(function(){
		$('.heatingcooling').attr('src', "images/snowflake_icon.png");
		$('.heatingcooling').fadeIn();
	});
}

function satisfied() {
	//console.log("satisfied");
	if (mode == "") { return false; }
	var sp = parseFloat($('.setpoint').text()),
		temp = parseFloat($('.indoorTemp_num').text());
	if (mode == "heating" && temp > sp + 0.5) { mode = ""; }
	if (mode == "cooling" && temp < sp - 0.5) { mode = ""; }
	if(mode == ""){
		$('#fan_btn .selected_icon').fadeOut();
		$('#heat_cool_btn .selected_icon').fadeOut();
		$('.heatingcooling').fadeOut();
		$('.fanon').removeClass('spin');
	}
}

function changeWeather(){
	var conditions = ["Sunny", "Rainy", "Cloudy"],
		rand = lastWeather;
	while(lastWeather === rand){//Never show the same twice
		rand = conditions[Math.floor(Math.random() * conditions.length)];
		//console.log(lastWeather, rand);
	}
	lastWeather = rand
	$('.weather').fadeOut(5000, function() {
		$(this).removeClass('active');
		$('.'+rand).addClass('active').fadeIn(5000);
	});
}

function switchUnits(unit){
	var current_unit = $('html').hasClass("f") ? "f" : "c",
		outdoorTemp = $('.outdoorTemp_num').text(),
		indoorTemp = $('.indoorTemp_num').text(),
		setpoint = $('.setpoint').text();
	console.log('switchUnits', unit, "from", current_unit);
	if(unit == "c"){
		outdoorTemp = f_to_c(outdoorTemp);
		indoorTemp = f_to_c(indoorTemp);
		setpoint = f_to_c(setpoint);
	}else{
		outdoorTemp = c_to_f(outdoorTemp);
		indoorTemp = c_to_f(indoorTemp);
		setpoint = c_to_f(setpoint);
	}
	$('.outdoorTemp_num').text(outdoorTemp.toFixed(0));
	$('.indoorTemp_num').text(indoorTemp.toFixed(1));
	$('.setpoint').text(setpoint.toFixed(1));
	$('.unit').html("&deg;"+unit.toUpperCase());
	$('html').removeClass(current_unit).addClass(unit);
}

function updateIndoorData(data){//JSONP Function (Called from Indoor WiFi Temp/Hum Device)
	disableFakeTemp = true;
	var current_unit = $('html').hasClass("f") ? "f" : "c";
	current_unit = current_unit.toUpperCase();
	if (data && data.f) {
		disableFakeTemp = true;
		if (current_unit == "F") {
			$('.indoorTemp_num').text(data.f).addClass('real');
		}else{
			$('.indoorTemp_num').text(data.c).addClass('real');
		}
		if (data.h) {
			$('.outdoorHum').text(data.h+"%").addClass('real');//Now indoor hum
		}
	}else{
		disableFakeTemp = false;
		$('.outdoorHum').removeClass('real');
		$('.indoorTemp_num').removeClass('real');
	}
}

function requestWeather(cb){
	zip = $('#zip').val();
	if (!cb) {
		cb = function(){};
		createCookie("zip", zip, 365);
		console.log("requestWeather cb not func, forced refresh, store cookie");
	}
	updatingWeather = true;
	var current_unit = $('html').hasClass("f") ? "f" : "c";
	current_unit = current_unit.toUpperCase();
	if (!zip) { return console.log("No city/zip for weather"); }
	var myConditions = ["Sun", "Sunny", "Rain", "Rainy", "Cloud", "Cloudy", "Clear"];
	var indoorDataUrl = $('#indoorDataUrl').val();//"http://10.0.1.36/?callback=?";
	if(indoorDataUrl != ""){
		disableFakeTemp = false;
		$('.outdoorHum').removeClass('real');
		$('.indoorTemp_num').removeClass('real');
		$.getJSON(indoorDataUrl);
	}
	// var indoor = $.getJSON("/indoorData").done(function(data) {
	// 	console.log("indoor: ", data);
	// 	if (data && data.f) {
	// 		disableFakeTemp = true;
	// 		if (current_unit == "F") {
	// 			$('.indoorTemp_num').text(data.f).addClass('real');
	// 		}else{
	// 			$('.indoorTemp_num').text(data.c).addClass('real');
	// 		}
	// 		if (data.h) {
	// 			$('.outdoorHum').text(data.h+"%").addClass('real');//Now indoor hum
	// 		}
	// 	}else{
	// 		disableFakeTemp = false;
	// 		$('.outdoorHum').removeClass('real');
	// 		$('.indoorTemp_num').removeClass('real');
	// 	}
	// }).fail(function() {
	// 	disableFakeTemp = false;
	// 	$('.outdoorHum').removeClass('real');
	// 	$('.indoorTemp_num').removeClass('real');
	// });
	$
	var outdoor = $.getJSON("/weatherData?zip="+zip+"&unit="+current_unit).done(function(data) {
		console.log("success", data );
		if (!data || data.length === 0) {
			updatingWeather = false;
			return console.log("No Data Found", data);
		}
		if (data.condition && data.condition !== lastWeather) {
			lastWeather = data.condition;
			$('.weatherCondition').text(data.condition);
			var myCondition = -1;
			for (var i = 0; i < myConditions.length; i++) {
				myCondition = data.condition.indexOf(myConditions[i]);
				console.log(myConditions[i], data.condition, myCondition);
				if (myCondition > -1) { myCondition = i; break; }
			}
			if (myCondition > -1) {
				if($('.weather.active').attr('src') == $('.'+myConditions[myCondition]).attr('src')){
					return false;//console.log("Same weather bg.");
				}
				$('.weather.active').fadeOut(5000, function() {
					$(this).removeClass('active');
					console.log("Showing", myConditions[myCondition], $('.'+myConditions[myCondition]))
					$('.'+myConditions[myCondition]).addClass('active').fadeIn(5000);
				});
			}
		}
		if(data.forecast){
			var forecastData = "<ul id='forecast-list'>";
			for (var i = 0; i < data.forecast.length; i++) {
				var item = data.forecast[i];
				console.log(item);
				forecastData += "<li><div style='float:right;font-size:0.7em'>"+parseInt(item.precip || 0)+"% Chance of Rain</div><b>"+item.day+"</b> &nbsp;"+item.skytextday+"<br />High:<span class='high'>"+item.high+"</span>&deg;"+current_unit+" / Low:<span class='low'>"+item.low+"</span>&deg;"+current_unit+"</li>";
			}
			forecastData += "</ul>";
			$('.forecast-page').html(forecastData);
		}
		if (data.temp) { $('.outdoorTemp_num').text(data.temp); }
		if (data.humidity && !disableFakeTemp) { $('.outdoorHum').text(data.humidity + "%"); }
		if (data.location) { $('.location').text(data.location); }
		updatingWeather = false;
		cb();
		return data;
	}).fail(function() {
		updatingWeather = false;
		//alert("Unable to get weather data.");
		console.log("Failed to get weather data");
	});
}

function f_to_c(valNum) {
  valNum = parseFloat(valNum);
  return (valNum-32) / 1.8;
}

function c_to_f(valNum) {
  valNum = parseFloat(valNum);
  return (valNum*1.8) + 32;
}

function round5(x){
	if (x == parseInt(x)-0.5 || 
		x == parseInt(x)+0.5 || 
		x == parseInt(x)) { return parseFloat(x); }
    return parseFloat(Math.round(parseInt(x)).toFixed(1));
}

// Cookies
function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";               

    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

function jsonCallback(json){
	console.log(json);
}
























































































































































































































































































$(function (){ $('#me').click(function(){ alert("YOU FOUND MY EASTER EGG\nMy name is Joe and I made this. This is a mockup of a SE8000 series thermostat.\n\nI know, not the coolest easter egg but hey.\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nMade By: Joseph Sammarco"); });  });