const browser = typeof window !== 'undefined';
const Impl = browser ? window.WebSocket : require('w' + 's');
const EventEmitter = require('eventemitter');

let socket_id = 0;

/* Used for detecting wrap-existing-websocket call */
const wrap = {};

/* Wrap an existing websocket, e.g. from a websocket server */
Websocket.wrap = (...args) => new Websocket(wrap, ...args);

Websocket.prototype = new EventEmitter();
Websocket.prototype.constructor = Websocket;

/* "s" intentionally lowercase */
function Websocket(...args) {
	EventEmitter.call(this);

	const id = ++socket_id;

	const do_wrap = args[0] === wrap;
	if (do_wrap) {
		args.shift();
	}

	const json = args[0] === 'json';
	if (json) {
		args.shift();
	}

	const ws = do_wrap ? args[0] : new Impl(...args);

	const receive = data => {
		if (json) {
			try {
				this.emit('message', JSON.parse(data));
			} catch (err) {
				this.emit('error', new Error('Invalid JSON received'));
			}
		} else {
			this.emit('message', data);
		}
	};

	const send = data => new Promise((res, rej) => {
		if (json) {
			data = JSON.stringify(data);
		}
		try {
			if (browser) {
				ws.send(data);
				res(data);
			} else {
				ws.send(data, err => {
					if (err) {
						rej(err);
					}
					res(err);
				});
			}
		} catch (err) {
			rej(err);
		}
	});

	if (browser) {
		ws.onmessage = event => receive(event.data);
		ws.onerror = event => this.emit('error', event); /* TODO: error message */
		ws.onopen = event => this.emit('open');
		ws.onclose = event => this.emit('close');
	} else {
		ws.onmessage = event => receive(event.data);
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

	this.is_open = () => ws.readyState === Impl.OPEN;

	this.send = data => send(data)
		.then(
			() => {
				this.emit('send', data);
			},
			err => {
				this.emit('error', err);
				return Promise.reject(err);
			});

	this.close = (...args) => ws.close(...args);
}

module.exports = Websocket;
