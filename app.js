//Loading Modules for express framework
const express = require('express');
const hbs = require('hbs');
const fs = require('fs');
const axios = require('axios');
//const sweetalert = require('sweetalert');

//loading the body parser to access post body elements
var bodyParser = require('body-parser');

var urlencodedparser = bodyParser.urlencoded({extended: false});

//adding port for heroku servers
const port = process.env.PORT || 4000;

var app = express();

//adding static public routes to express
app.use(express.static(__dirname + '/public'));

//setting handlebar as the templating engine
app.set('view engine', 'hbs');

//registering partials for the handlebar templating engine
hbs.registerPartials(__dirname + '/views/partials');

//registering helpers
hbs.registerHelper('currentYear', ()=>{
  return new Date().getFullYear();
});

hbs.registerHelper('currentDate', ()=>{
  return new Date().getDate();
});

hbs.registerHelper('currentMonth', ()=>{
  mlist = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
    return mlist[new Date().getMonth()];
});

var currentTime = ()=>{
  var date = new Date();
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
};

hbs.registerHelper('currentDay', ()=>{
  var day = new Date().getDay();
  if(day == 0){
    return 'Sunday';
  }
  else if(day == 1){
    return 'Monday';
  }
  else if (day == 2) {
    return 'Tuesday';
  }
  else if (day == 3) {
    return 'Wednesday';
  }
  else if (day == 4) {
    return 'Thrusday';
  }
  else if (day == 5) {
    return 'Friday';
  }
  else if (day == 6) {
    return 'Saturday';
  }
});

// hbs.registerHelper('swal', ()=>{
//   return sweetalert({
//   text: "Hello world!",
// });
// });

//Route for making server logs
app.use((request, response, next)=>{
  var now = new Date().toString();
  var log = `${now}: ${request.method} ${request.url}`;

  fs.appendFile('server.log', log, (err)=>{
    if(err){
      console.log('Could not append to file !');
    }
  });
  next();
})

app.get('/', (request, response)=>{
  response.render('home.hbs', {
    pageTitle: 'Stormy',
    tagLine: 'Weatherv App',
    author: 'Kunal Singh'
  });
});

app.post('/get-weather', urlencodedparser, (request, response)=>{
  var encodedAddress = encodeURIComponent(request.body.location);
  var geocodeUrl = `http://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}`;
  var lat;
  var lng;
  var address;
  var temperature;
  var apparentTemperature;
  var windspeed;
  var rain;
  var icon;
  var time;

  axios.get((geocodeUrl)).then((res)=>{
    //console.log(response.data);
    if(res.data.status === 'ZERO_RESULTS'){
      throw new Error('Unable to find that address !');
    }
    lat = res.data.results[0].geometry.location.lat;
    lng = res.data.results[0].geometry.location.lng;


    var weatherUrl = `https://api.darksky.net/forecast/6a0ead4bce35c8f7842d5eb3d22af956/${lat},${lng}`;
    address = res.data.results[0].formatted_address;
    console.log(address);

    return axios.get(weatherUrl);
  })
  .then((res)=>{
    temperature = res.data.currently.temperature;
    apparentTemperature = res.data.currently.apparentTemperature;
    windspeed = res.data.currently.windSpeed;
    rain = res.data.currently.precipProbability;
    time = new Date(res.data.currently.time);
    icon = res.data.currently.icon;

    response.send({
      'address':address,
      'lat': lat,
      'lng': lng,
      'temperature': temperature,
      'apparentTemperature': apparentTemperature,
      'wind': windspeed,
      'rain': rain,
      'icon': icon,
      'time': currentTime()
    });

    console.log(`Its currently ${temperature} but it feels like ${apparentTemperature}`);
  })
  .catch(()=>{
    if(e.code === 'ENOTFOUND'){
      console.log('Unable to connect to API Servers');
    }
    else{
      console.log(e.message);
    }
  });

});

app.listen(port, ()=>{
  console.log(`Server is up on port ${port}`);
})
