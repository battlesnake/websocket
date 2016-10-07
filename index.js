const browser = typeof window !== 'undefined';
const Impl = browser ? window.WebSocket : require('w' + 's');
const EventEmitter = require('eventemitter');

Websocket.prototype = new EventEmitter();

/* "s" intentionally lowercase */
function Websocket(...args) {
	EventEmitter.call(this);

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

	if (process.env.DEBUG_WEBSOCKET) {
		this.on('message', msg => console.info('WS:RECV>', msg));
		this.on('send', msg => console.info('WS:SEND>', msg));
		this.on('open', () => console.info('WS:OPEN>', args));
		this.on('close', () => console.info('WS:CLOSE>'));
	}

	this.send = data => { ws.send(data); this.emit('send', data); };
	this.close = (...args) => ws.close(...args);
}

module.exports = Websocket;
