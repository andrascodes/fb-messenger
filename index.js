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

// Messaging functions
//Function to Send Text Messages
function sendTextMessage(sender, text) {
    messageData = {
        text: text
    };
    
    request(
        {
            url: 'https://graph.facebook.com/v2.6/me/messages',
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

// Function to Send Structured Messages (Generic Message template)
function sendGenericMessage(sender) {
    messageData = {
        
        "attachment": {
            "type": "template",
            
            "payload": {
                "template_type": "generic",
                
                //Array of cards in a horizontal scroll
                "elements": [ 
                    // One card
                    {
                        "title": "First card",
                        "subtitle": "Element #1 of an hscroll.",
                        "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
                        // Buttons on Card ONE
                        "buttons": [
                            // First Button: takes to a URL
                            {
                                "type": "web_url",
                                "url": "https://www.messenger.com",
                                "title": "Web url"
                            },
                            // Second Button: makes a postback backend call to
                            // the webhook when the button is tapped
                            {
                                "type": "postback",
                                "title": "Postback",
                                "payload": "Payload for first element in a generic bubble"
                            }
                        ]
                    },
                    
                    // Second card
                    {
                        "title": "Second card",
                        "subtitle": "Element #2 of an hscroll",
                        "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                        "buttons": [
                            // First Button: postback call
                            {
                                "type": "postback",
                                "title": "Postback",
                                "payload": "Payload for second element in generic bubble"
                            }
                        ]
                    }
                ],
            },
        }  
    };
    
    request(
        {
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs:{ access_token: FB_PAGE_TOKEN },
            method: 'POST',
            json: {
                recipient: { id: sender },
                message: messageData,
            }
        }, 
        function(error, response, body) {
            if(error) {
                console.log('Error sending messages ', error);
            }
            else if(response.body.error) {
                console.log('Error: ', response.body.error);
            }
        }
    );
    
}


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

// API endpoint To process messages
app.post('/webhook', function(req, res) {
    messaging_events = req.body.entry[0].messaging;
    console.log(messaging_events);
    ev = req.body.entry[0].messaging[0];
    me = ev.sender.id;
    console.log(ev);
    console.log(me);
    request(`https://graph.facebook.com/v2.6/${me}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=FB_PAGE_TOKEN`, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(JSON.parse(body));
        }
    });


    for(i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        if(event.message && event.message.text) {
            text = event.message.text;
            
            // if text IS 'Generic' we can send a Generic Message
            if(text === 'Generic') {
                sendGenericMessage(sender);
                // 'continue': Start the next iteration of the loop immediately
                continue;
            }
            // if text is NOT 'Generic' we can send a TEXT Message
            sendTextMessage(sender, "Text received, echo: " + text.substring(0,200));
        }
        // if user clicks on postback button
        if(event.postback) {
            text = JSON.stringify(event.postback);
            sendTextMessage(sender, "Postback received: " + text.substring(0, 200), FB_PAGE_TOKEN);
            continue;
        }
    }
    res.sendStatus(200);
});



//Start server
app.listen( app.get('port'), function() {
    console.log('app running on port', app.get('port'));    
});