'use strict';

const crypto = require('crypto'),
    EntityType = require('./../Constants').StorageEntityType,
    AzuriteRequest = require('./AzuriteRequest'),
    N = require('./HttpHeaderNames'),
    env = require('./../env'),
    InternalAzuriteError = require('./../InternalAzuriteError');

class AzuriteBlobRequest extends AzuriteRequest {
    constructor({
        req = undefined,
        entityType = undefined,
        payload = undefined }) {

        super({
            req: req,
            entityType: entityType || req.headers['x-ms-blob-type'],
            payload: payload
        });
        this.containerName = req.params.container;
        this.blobName = req.params[0];
        this.blockId = req.query.blockid;
        this.snapshot = false;
        // Per default, all (block) blobs will be set to committed by EntityGenerator 
        this.commit = true;
        // Valid values are 'committed' (default), 'uncommitted', and 'all'
        if (this.query.blocklisttype) {
            this.blockListType = this.query.blocklisttype || 'committed';
        }
        if (this.query.snapshot) {
            this.snapshotDate = this.query.snapshot
            this.snapshot = true;
            this.id = env.snapshotId(this.containerName, this.blobName, this.snapshotDate);
            this.originId = env.blobId(this.containerName, this.blobName);
            this.parentUri = env.diskStorageUri(this.originId);
        } else if (this.blockId) {
            this.parent = `${this.containerName}-${this.blobName}`;
            // this.blockName = `${this.containerName}-${this.blobName}-${this.blockId}`;
            this.id = env.blockId(this.containerName, this.blobName, this.blockId);
            this.parentId = env.blobId(this.containerName, this.blobName);
            this.parentUri = env.diskStorageUri(this.parentId);
        } else {
            this.id = env.blobId(this.containerName, this.blobName);
        }
        this.uri = env.diskStorageUri(this.id);
    }

    static clone(request) {
        const copy = new AzuriteBlobRequest({ req: { rawHeaders: [], headers: {}, params: {}, query: {} }, entityType: request.entityType, payload: request.payload });
        Object.assign(copy, request);
        return copy;
    }

    calculateContentMd5() {
        if (!this.body) {
            throw new InternalAzuriteError('Request: MD5 calculation without initialized body.');
        }
        return crypto.createHash('md5')
            .update(this.body)
            .digest('base64');
    }

    enableSnapshot(snapshotDate) {
        this.snapshotDate = snapshotDate;
        this.snapshot = true;
    }

    /**
    * Checks whether blob name corresponds to a virtual directory. This is true if the name ends with at least one trailing slash.
    * 
    * @returns true if name is followed by at least one '/' character, false otherwise.  
    * 
    * @memberof AzuriteBlobRequest
    */
    isVirtualDirectory() {
        return this.blobName.match('.*\/+$') !== null;
    }

    isSnapshot() {
        return this.snapshot;
    }

    /**
     * Return the blob's URI of Azurite's internal file system location.
     * 
     * @memberof AzuriteBlobRequest
     */
    copySourceUrl() {
        if (this.httpProps[N.COPY_SOURCE === undefined]) {
            throw new InternalAzuriteError('Request: copySourceUrl was called without copy-source header set.')
        }
        let uri;
        const source = this.httpProps[N.COPY_SOURCE];

        // Same Storage account
        if (source.includes('http://127.0.0.1/devstoreaccount1/')) {
            source = source.replace('http://127.0.0.1/devstoreaccount1/', '');
            uri = env.diskStorageUri(this);
        }
        return result;
    }
}

module.exports = AzuriteBlobRequest;