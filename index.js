const browser = typeof window !== 'undefined';
const Impl = browser ? window.WebSocket : require('w' + 's');
const EventEmitter = require('eventemitter');

Websocket.prototype = new EventEmitter();

let socket_id = 0;

/* "s" intentionally lowercase */
function Websocket(...args) {
	EventEmitter.call(this);
	const id = ++socket_id;

	const ws = new Impl(...args);

	if (browser) {
		ws.onmessage = event => this.emit('message', event.data);
		ws.onerror = event => this.emit('error', ...args); /* TODO */
		ws.onopen = event => this.emit('open');
		ws.onclose = event => this.emit('close');
	} else {
		ws.onmessage = event => this.emit('message', event.data);
		ws.onerror = err => this.emit('error', err);
		ws.onopen = () => this.emit('open');
		ws.onclose = () => this.emit('close');
	}

	this.debug = false;

	if (this.debug || process.env.DEBUG_WEBSOCKET) {
		const log = (cmd, ...args) => console.info(`WS #${id} ${cmd}>`, ...args);
		this.on('message', msg => log('recv', msg));
		this.on('send', msg => log('send', msg));
		this.on('open', () => log('open'));
		this.on('close', () => log('close'));
	}

	this.send = (data, cb) => {
		try {
			ws.send(data);
			this.emit('send', data);
		} catch (err) {
			return cb && cb(err), undefined;
		}
		return cb && cb(), undefined;
	};
	this.close = (...args) => ws.close(...args);
}

module.exports = Websocket;
