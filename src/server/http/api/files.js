var express = require('express');
var HttpStatus = require('http-status-codes');

var filesApi = express.Router();

filesApi.param('fileUUID', function(req, res, next, uuid) {
    var fileHandler = req.app.get('fileHandler');
    fileHandler.get(uuid).then(function(file) {
        req.file = file;
        next();
    }).catch(function(err) {
        /* istanbul ignore else: This should never happen */
        if(err && err.isNotExist) {
            res.status(HttpStatus.NOT_FOUND).send({
                error: HttpStatus.getStatusText(HttpStatus.NOT_FOUND)
            });
        } else {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                error: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR)
            });
        }
    });
});

filesApi.param('chunk', function(req, res, next, chunk) {
    var chunkNumber = Number(chunk);
    if(isNaN(chunkNumber)) {
        res.status(HttpStatus.BAD_REQUEST).send({
            error: 'Chunk must be a number'
        });
        return;
    }
    if(chunkNumber >= req.file.numChunks || chunkNumber < 0) {
        res.status(HttpStatus.NOT_FOUND).send({
            error: HttpStatus.getStatusText(HttpStatus.NOT_FOUND)
        });
        return;
    }

    req.chunk = chunkNumber;
    next();
});


filesApi.get('/:fileUUID', function(req, res) {
    var file = req.file;
    res.status(HttpStatus.OK).send({
        uuid: file.uuid,
        fileName: file.fileName,
        mediaType: file.mediaType,
        chunks: file.numChunks
    });
});

filesApi.get('/:fileUUID/download', function(req, res) {
    var file = req.file;
    res.status(HttpStatus.OK)
        .attachment(file.fileName)
        .set('ETag', file.uuid)
        .set('Cache-Control', 'public, max-age=31557600'); // cache per default for one year.
    file.stream().pipe(res);
});

filesApi.get('/:fileUUID/chunks/:chunk', function(req, res) {
    var file = req.file;

    file.chunkID(req.chunk).then(function(chunkID) {
        res.status(HttpStatus.OK).send({
            uuid: chunkID
        });
    });
});

filesApi.get('/:fileUUID/chunks/:chunk/download', function(req, res) {
    var file = req.file;

    res.status(HttpStatus.OK)
        .set('Content-Type', 'application/octet-stream')
        .set('ETag', file.uuid + '/' + req.chunk)
        .set('Cache-Control', 'public, max-age=31557600'); // cache per default for one year.
    file.chunkStream(req.chunk).pipe(res);
});

export default filesApi;
