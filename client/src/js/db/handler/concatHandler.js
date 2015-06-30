var Q = require('q');
var fileSaver = require('filesaver.js');
var blob = require('../../blob');

class ConcatHandler {
    constructor(file) {
        var self = this;
        self.file = file;
    }

    /**
     * returns if a concat can be done i.e. if all parts are locally available.
     * @returns {Promise.<boolean>}
     */
    available() {
        var self = this;
        var promises = [];
        for(var i = 0; i < self.file.numChunks; i++) {
            promises.push(self.file.hasChunk(i));
        }
        return Q.all(promises).then(function(result) {
            return result.indexOf(false) === -1;
        });
    }

    /**
     * Constructs the complete data blob. Throws an error if this
     * is not possible.
     *
     * @returns {Promise.<Blob>}
     */
    blob() {
        var self = this;
        self.available().then(function(isDownloadable) {
            if(!isDownloadable) {
                throw new Error(
                    "Can not download file with id " + self.file.id + " " +
                    "it has not been completely fetched yet."
                );
            }

            var blobBuilder = new blob.BlobBuilder();
            var appendChunk = function(chunkNum) {
                return self.file.getChunk(chunkNum).then(function(data) {
                    blobBuilder.append(data);
                });
            };

            var promise = Q();
            for(var currentChunk = 0; currentChunk < self.file.numChunks; currentChunk++) {
                promise = promise.then(appendChunk(currentChunk));
            }
            return promise.then(function() {
                return blobBuilder.getBlob(self.file.mimeType);
            });
        });
    }
}

export default ConcatHandler;
