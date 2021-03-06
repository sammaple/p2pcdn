var events = require('events');
var NegotiationMessage = require('./negotiation');

var errorCodes = {
    'NON_BINARY': 1,
    'ENCODING_FAILED': 2
};

/**
 * Class which wraps the websockets common functionality
 * to only send negotiation messages.
 */
class NegotiationWs extends events.EventEmitter {

    constructor(ws) {
        super();
        var self = this;
        self.ws = ws;
    }

    start() {
        var self = this;
        self._initEvents();
    }

    _initEvents() {
        var self = this;
        self.ws.on('message', self.handleMessage.bind(self));
    }

    handleMessage(data, flags) {
        var self = this;
        if(flags && !flags.binary) {
            // Wrong message type. Only accepting binary data -> close
            self.ws.close(errorCodes.NON_BINARY);
            return;
        }

        NegotiationMessage.deserialize(data).then(function(message) {
            self.emit('message', message);
        }, function(err) {
            self.ws.close(errorCodes.ENCODING_FAILED, err.toString());
        }).done();
    }

    send(message) {
        var self = this;
        return message.serialize().then(function(arrayBuffer) {
            self.ws.send(arrayBuffer);
        });
    }

    close(code, reason) {
        var self = this;
        self.ws.close(code, reason);
    }

}
NegotiationWs.ErrorCodes = errorCodes;

export default NegotiationWs;
