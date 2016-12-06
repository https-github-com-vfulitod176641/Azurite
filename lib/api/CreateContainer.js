'use strict';

const storageManager = require('./../StorageManager');

class CreateContainer {
    constructor() {
    }

    process(req, res, containerName, options) {
        storageManager.createContainer(containerName)
            .then((result) => {
                console.log(`Successfully created container "${containerName}"`);
                res.status(200).send();
            })
            .catch((e) => {
                if (e.code === "EEXIST") {
                    console.error(`Container ${containerName} already exists.`);
                    res.status(409).send();
                } else {
                    res.status(500).send();
                    throw e;
                }
            });
    }
}

module.exports = new CreateContainer();