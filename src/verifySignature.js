const crypto = require('crypto');

const isVerified = (req) => {
	const signature = req.headers['x-slack-signature'];
	const timestamp = req.headers['x-slack-request-timestamp'];
	const hmac = crypto.createHmac('sha256',process.env.SLACK_SIGNING_SECRET);
	
	console.log(req.headers);

	const [version,hash] = signature.split('=');

	const fiveMinutesAgo = ~~(Date.now()/100) - (60 * 5);

	if(timestamp < fiveMinutesAgo) return false;

	hmac.update(`${version}:${timestamp}:${req.rawBody}`);

	return hmac.digest('hex') == hash;
}

module.exports = { isVerified};
