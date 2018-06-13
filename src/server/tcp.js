import TransportStream from 'winston-transport';
import util from 'util';
import net from 'net';

const debug = util.debuglog('winston:tcp');

class EntryBuffer {
  constructor(maxLength) {
    this.buffer = [];
    this.maxLength = maxLength || false;
  }

  add(entry) {
    if (this.maxLength === false || this.buffer.length < this.maxLength) {
      debug('entry is %s', typeof entry);
      this.buffer.push(entry);
    }
  }

  drain(callback) {
    if (typeof callback === 'function') {
      let i = this.buffer.length;

      while (i--) {
        callback(this.buffer[i]);
      }
    }

    this.buffer = [];
  }

  length() {
    return this.buffer.length;
  }
}

class TcpTransport extends TransportStream {
  constructor(options = {}) {
    super(options);

    // store config
    this.options = options;

    // generic transport requirements
    this.name = 'winston-tcp';

    // internal flags
    this.connected = false;
    this.connectionAttempts = 0; // cleared after each connection
    this.connectionCount = 0;
    this.reconnect = false;
    this.reconnectInterval = options.reconnectInterval || 1000;
    this.reconnectAttempts = options.reconnectAttempts || 100;
    this.bufferLength = options.bufferLength || 10000;
    // initiate entry buffer
    this.entryBuffer = new EntryBuffer(this.bufferLength);

    this.connect();
  }

  connect() {
    if (!this.connected) {
      if (this.connectionAttempts >= this.options.reconnectAttempts) {
        throw Error('maximum reconnection attempts');
      }

      debug('connection attempt #%s', ++this.connectionAttempts);

      this.reconnect = true;
      this.socket = new net.Socket();
      this.socket.unref();

      this.socket.on('error', err => debug('socket error %j', err));

      this.socket.on('connect', () => {
        this.connected = true;
        this.connectionAttempts = 0;

        debug('connection established #%s', ++this.connectionCount);

        // attempt to resend messages

        const bufferLength = this.entryBuffer.length();

        if (bufferLength) {
          debug('draining buffer of %s entries', bufferLength);

          this.entryBuffer.drain(this.write.bind(this));
        }
      });

      this.socket.on('close', () => {
        debug('connection closed');

        this.socket.destroy();
        this.connected = false;

        if (this.reconnect) {
          debug('attempt to reconnect in %s', this.reconnectInterval);

          setTimeout(this.connect.bind(this), this.reconnectInterval);
        }
      });

      this.socket.connect(this.options.port, this.options.host);
    }
  }

  disconnect(callback) {
    this.connected = false;
    this.reconnect = false;
    this.socket.end(callback);
  }

  write(entry, callback) {
    if (!entry.timestamp) entry.timestamp = new Date();
    debug('writing timestamp %s', entry.timestamp);
    if (this.connected) {
      debug('writing to socket %j', entry);

      this.socket.write(JSON.stringify(entry), 'utf8', () => {
        if (typeof callback === 'function') {
          callback(null, true);
        }
      });
    } else {
      debug('writing to buffer %j', entry);

      this.entryBuffer.add(entry);

      if (typeof callback === 'function') {
        callback(null, true);
      }
    }
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    this.write(info, callback);

    if (callback) {
      callback();
    }
  }
}

export default TcpTransport;
