// Requirements

// Web app framework, API development
const express = require('express');

// Extracts the body portion of the incoming request stream into req.body
const bodyParser = require('body-parser');

// Makes it easier to perform HTTP requests, follows redirects by default
const request = require('request');

// process.env.PORT lets the port be set by Heroku
const PORT = process.env.PORT || 8445;

// Facebook authentication environment variables
const FB_PAGE_ID = process.env.FB_PAGE_ID && Number(process.env.FB_PAGE_ID);
const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

// Express settings
const app = express();
app.set('port', PORT);

// app.use add a middleware layer to the middleware stack
// adding bodyParser you're ensuring your server handles
// incoming requests through the express middleware

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
app.use(bodyParser.json());

// Index route
app.get('/', function(req, res){
    res.send('Hello world, I am a chat bot.');
});

// Facebook verification, webhook setup
app.get('/webhook', function(req, res) {
    if(req.query['hub.mode'] === 'subscribe' &&
       req.query['hub.verify_token'] === FB_VERIFY_TOKEN) 
    {
        // successful verification
        res.send(req.query['hub.challenge']);
    }
    else {
        // unsuccessful verification
        res.sendStatus(400);
    }
});

//Function to ECHO back messages
function sendTextMessage(sender, text) {
    messageData = {
        text: text
    };
    
    request(
        {
            url: '',
            qs: { access_token: FB_PAGE_TOKEN },
            method: 'POST',
            json: {
                recipient: { id: sender },
                message: messageData,
            }
        }, 
        function(error, response, body) {
            if(error) {
                console.log('Error sending messages: ', error);
            }
            else if(response.body.error) {
                console.log('Error: ', response.body.error);
            }
        }
    );
}

// API endpoint To process messages
app.post('/webhook', function(req, res) {
    messaging_events = req.body.entry[0].messaging;
    for(i=0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        if(event.message && event.message.text) {
            text = event.message.text;
            sendTextMessage(sender, "Text received, echo: " + text.substring(0,200));
        }
    }
    res.sendStatus(200);
});



//Start server
app.listen( app.get('port'), function() {
    console.log('app running on port', app.get('port'));    
});