'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');
const autoIncrement = require('mongoose-auto-increment');


var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
const connection = mongoose.createConnection(process.env.MONGOLAB_URI);

autoIncrement.initialize(connection);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

// Database configuration
var schema = new mongoose.Schema({
  url: String
});


schema.plugin(autoIncrement.plugin, "Url");

const Url = connection.model("Url", schema);


app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// this is for creating a new url
app.post("/api/shorturl/new", (req, res) => {
  // get the url from the body of the request
  const requestedUrl = req.body.url.replace(/https?:\/\//, '');
  if (requestedUrl){
      dns.lookup(requestedUrl, (err, addresses, family) => {
      if (err) {
        console.log(err);
        res.json({"error":"invalid URL"});
      } else {
        // if not in database then create a new one
        Url.findOne({url: requestedUrl}, (err, url) => {
          if (err){
            console.log(err);
          }
          else {
            if(url){
              res.json({"original_url": url.url, "short_url": url._id});
            } else {
              Url.create({url: requestedUrl}, (err, newUrl) => {
                if (err) {
                  console.log(err)
                } else {
                res.json({"original_url": newUrl.url, "short_url": newUrl._id});
                }
              });
            }
          }
        });
        // return the response json with the fetched or newly created url id
        
      }
    });
  } else {
    res.json({"error":"invalid URL"});
  }
});

// this is for redirecting to the requested url
app.get("/api/shorturl/:urlId", (req, res) => {
  const urlId = Number(req.params.urlId);
  if(isNaN(urlId)) {
   res.redirect("https://" + req.params.urlId);
  } else {
    // redirect using url string 
    Url.findById({"_id": urlId}, (err, thisurl) => {
      if (err) {
        console.log(err);
        res.json({"error":"invalid URL"});
      } else {
        res.redirect("https://" + thisurl.url)
      }
    });
  }
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});