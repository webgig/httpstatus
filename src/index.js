'use strict';
require('dotenv').config();

const httpstatus = require('./httpstatus');
const signature = require('./verifySignature');


const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const axios = require('axios');
const qs = require('qs');


const apiUrl = 'http://slack.com/api';


const app = express();

const rawBodyBuffer = (req,res,buf,encoding) => {
	if(buf && buf.length){
		req.rawBody = buf.toString(encoding || 'utf-8');
	}
};


app.use(bodyParser.json({verify: rawBodyBuffer}));
app.use(bodyParser.urlencoded({verify:rawBodyBuffer, extended: true}));



app.use(express.static(__dirname + '/../')); // html
app.use(express.static(__dirname + '/../public')); // images


app.get('/slack',(req, res)=> {
	
	if(!req.query.code){ 
		res.redirect('/?error=access_denied');
		return;
	}


	const authInfo = {form:{ client_id: process.env.SLACK_CLIENT_ID, 
					   		client_secret: process.env.SLACK_CLIENT_SECRET, 
					   		code: req.query.code 
						}
					};

	axios.post(`${apiUrl}/oauth.access`, qs.stringify(authInfo))
	.then((result) => {
		
		console.log(result.data);

  		const { access_token, refresh_token, expires_in, error } = result.data;

  		if(error){
  			res.sendStatus(401);
  			console.log(error);
  			return;
  		}

		axios.post(`${apiUrl}/team.info`, qs.stringify({token: access_token}))
		.then((result) => { 
		  if(!result.data.error){
		  	res.redirect(`http.//${result.data.team.domain}.slack.com`);
		  }	
		}).catch((err) => { console.error(err); });
		
	}).catch((err) => {
      console.error(err);
	});

})




app.post('/', (req,res) => {

	// if(!signature.isVerified(req)){
	// 	res.sendStatus(404);
	// 	return;
	// }


	let message = {};

	if(req.body.text){
		const code = req.body.text;

		if(! /^\d+$/.test(code)){
     		res.send(':crying_cat_face:U R DOIN IT WRONG. Enter a status code like 200');
     		return;
		}

		const status = httpstatus[code];
		if(!status){
			res.send('Bummer, ' + code + 'is not a HTTP status code :scream_cat:');
			return;
		}

		message = {
			response_type: 'in_channel',
			attachments:[
				{ 
					pretext: `${code}: ${status}`,
					image_url: `https://http.cat/${code}.jpg`
				}
			]
		};
		console.log(message);
	} else {

		message = {
			response_type: 'ephemeral',      
			text: ':cat: How to use `/httpstatus` command:',
			attachments:[
				{ 
					text: 'Type a status code after the command, _e.g._ `/httpstatus 404`'
				}
			]
		};
	}


	res.json(message);
});



const server = app.listen(3000, () => { 
	console.log('Express server listening on port %d in %s mode', server.address().port,app.settings.env);
})
