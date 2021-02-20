/**
 * @module fw/source/FileUploadSource
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var AjaxError = require('../error/AjaxError');
var DataSource = require('../source/DataSource');
var FwAjax = require('../net/Ajax');
var FwElement = require('../ui/Element');
var FwPromise = require('../Promise');
var NetSource = require('../source/NetSource');
var types = require('../types');
var utils = require('../utils');

// Process before handler
function processBeforeHandler(promise, handler) {
    if (handler.done) {
        promise.then(handler.done);
    } else if (handler.fail) {
        promise.catch(handler.fail);
    }
}

// Process handler
function processHandler(promise, handler) {
    if (handler.done) {
        promise.then(function (data) {
            var output = handler.done(data);

            return output === undefined ? data : output;
        });
    } else if (handler.fail) {
        promise.catch (function (error) {
            var output = handler.fail(error);

            if (output === undefined) {
                throw error;
            }
            return output;
        });
    }
}

/**
 * Create an instance of fw/source/FileUploadSource associated with the fw/ui/form/(.*)
 * @class
 * @alias module:fw/source/FileUploadSource
 * @augments fw/source/NetSource
 * @param {Object} config - the configuration object of the FileUploadSource
 * @param {string} config.url - the URL of ajax request
 * @param {Object} [config.parameters] - optional parameters sent in each ajax request
 * @param {number} [config.timeout] - timeout of the request
 */
class FileUploadSource extends NetSource {
    /**
     * @constructor
     */
    constructor(config) {
        super(config);

        this.ajaxInstances = [];
        this.files = [];
    }
    /**
     * Bind a FileUploadField to the FileUploadSource
     * @method bind
     * @param {fw/ui/FileUploadField} - FileUploadField to bind to the FileUploadSource
     */
    bind(fileUploadField) {
        if (!(fileUploadField instanceof FwElement)) return;
        if ((fileUploadField.fileUploadSource !== this) && (fileUploadField.fileUploadSource instanceof FileUploadSource)) {
            fileUploadField.fileUploadSource.unbind();
        }

        fileUploadField.fileUploadSource = this;
        this.fileUploadField = fileUploadField;
    }
    /**
     * Unbind a FileUploadField from the FileUploadSource
     * @method unbind
     */
    unbind() {
        if (this.fileUploadField === null) return;

        this.abort();
        this.fileUploadField.fileUploadSource = null;
        this.fileUploadField = null;
    }
    /**
     * Append a file to the queue
     * @method appendFile
     * @param {File} file - file to be added
     * @return {boolean} successfully append
     */
    appendFile(file) {
        if (!(file instanceof File)) return false;
        if (this.files.indexOf(file) !== -1) return false;

        file.state = FileUploadSource.STATE_WAITING;
        file.progress = 0;
        this.files.push(file);

        return true;
    }
    /**
     * Upload all files added to the queue and remove uploaded files
     * @method upload
     * @param {Object} options - options associated with the request
     * @return {fw/Promise}
     */
    upload(options) {
        options = options || {};

        var self = this;
        var n = 0;
        var l = this.files.length;
        var filesAreWaiting = false;
        var uploadPromises, file, parameters;
        // Remove all uploaded files and check if files are awaiting upload
        while (n < l) {
            file = this.files[n];

            if (file.state === FileUploadSource.STATE_WAITING) {
                filesAreWaiting = true;
                n++;
            } else if (file.state > FileUploadSource.STATE_UPLOADED) {
                this.files.splice(n, 1);
                l--;
            } else {
                n++;
            }
        }
        // If no file is awaiting upload then returns
        if (!filesAreWaiting) return;

        parameters = utils.copyObject(
            this.parameters instanceof DataSource ? this.parameters.getObject() : this.parameters,
            options instanceof DataSource ? options.getObject() : options
        );

        // Upload file
        function uploadFile(file) {
            var n, l;
            var uploadPromise, promise, ajaxInstance;
            // Check if the file state is cancelled
            if (file.state === FileUploadSource.STATE_CANCELLED) {
                // If cancelled, return a rejected promise
                return new FwPromise.reject();
            }
            // Check if the file is awaiting upload
            else if (file.state !== FileUploadSource.STATE_WAITING) {
                // If file is not in waiting state, return a resolved promise
                return new FwPromise.resolve();
            }
            // Set the instance active
            self.active = true;
            // Create a starting promise
            uploadPromise = new FwPromise(function(resolve) {
                resolve(file);
            });
            // Append with success and fail handlers before the ajax request
            for (n = 0, l = self.beforeHandlers.length; n < l; n++) {
                processBeforeHandler(uploadPromise, self.beforeHandlers[n]);
            }
            // Append with the ajax request
            promise = uploadPromise.then(function() {
                // Check if the file state is cancelled
                if (file.state === FileUploadSource.STATE_CANCELLED) {
                    // If cancelled, throw an AjaxError
                    throw new AjaxError({ status: AjaxError.REQUEST_ABORTED });
                }
                // Create a formData to append the file
                var formData = new FormData();

                formData.append('file', file);
                // Check if parameters is not empty
                if (!types.isEmptyObject(parameters)) {
                    // If not empty, append formData with them
                    formData.append('parameters', JSON.stringify(self.processParameters(parameters)));
                }
                // Create an ajax request and register in the ajax requests store
                self.ajaxInstances.push(ajaxInstance = new FwAjax({
                    url:        self.url,
                    type:       'POST',
                    data:       formData,
                    timeout:    self.timeout,
                    // onLoadStart is called in the beginning of the upload
                    onLoadStart: function() {
                        file.state = FileUploadSource.STATE_IN_PROGRESS;
                        file.progress = 0;
                        if (types.isFunction(file.onChangeState)) {
                            file.onChangeState(file.state);
                        }
                    },
                    // onProgress is called during the upload
                    onProgress: function(e) {
                        if (file.state === FileUploadSource.STATE_IN_PROGRESS) {
                            if (e.lengthComputable) {
                                file.progress = (e.loaded * 100) / e.total;
                            }
                            if (types.isFunction(file.onChangeState)) {
                                file.onChangeState(file.state);
                            }
                        }
                    },
                    // onLoadEnd is called at the end of the upload
                    onLoadEnd: function(e) {
                        if (file.state === FileUploadSource.STATE_IN_PROGRESS) {
                            file.state = FileUploadSource.STATE_UPLOADED;
                            file.progress = 100;
                            if (types.isFunction(file.onChangeState)) {
                                file.onChangeState(file.state);
                            }
                        }
                    }
                }));

                file.ajaxInstance = ajaxInstance;

                return ajaxInstance.promise;
            }).then(
                // Remove the ajax request in the ajax requests store and set file state to sucessful
                function(response) {
                    var index = self.ajaxInstances.indexOf(ajaxInstance);

                    if (index !== -1) {
                        self.ajaxInstances.splice(index, 1);
                    }
                    // Deactivate the instance when no request is no longer in progress
                    if (self.ajaxInstances.length === 0) {
                        self.active = false;
                    }

                    if (file.state === FileUploadSource.STATE_UPLOADED) {
                        file.state = FileUploadSource.STATE_SUCCESSFUL;
                        if (types.isFunction(file.onChangeState)) {
                            file.onChangeState(file.state);
                        }
                    }

                    return response;
                },
                // Remove the ajax request in the ajax requests store and set file state to error
                // or cancelled if the request was aborted
                function(error) {
                    var index = self.ajaxInstances.indexOf(ajaxInstance);

                    if (index !== -1) {
                        self.ajaxInstances.splice(index, 1);
                    }

                    if (self.ajaxInstances.length === 0) {
                        self.active = false;
                    }
                    // Set the file state of the promise to cancelled when the request is aborted
                    if (error instanceof AjaxError) {
                        if (error.status === AjaxError.REQUEST_ABORTED) {
                            file.state = FileUploadSource.STATE_CANCELLED;
                        }
                    }
                    // Set the file state to error when the request is not cancelled
                    if (file.state !== FileUploadSource.STATE_CANCELLED) {
                        file.state = FileUploadSource.STATE_ERROR;
                    }

                    if (types.isFunction(file.onChangeState)) {
                        file.onChangeState(file.state);
                    }

                    throw error;
                }
            );
            // Append with success and fail handlers
            for (n = 0, l = self.handlers.length; n < l; n++) {
                processHandler(promise, self.handlers[n]);
            }

            return promise;
        }

        uploadPromises = [];

        for (n = 0; n < l; n++) {
            if (this.files[n].state === FileUploadSource.STATE_WAITING) {
                uploadPromises.push(uploadFile(this.files[n]));
            }
        }

        return FwPromise.all(uploadPromises);
    }
    /**
     * Abort the request
     * @method abort
     * @return {fw/source/FileUploadSource}
     */
    abort() {
        var n, l, file;
        // Deactivate the FileUploadSource
        this.active = false;
        // Abort all the ajax requests in progress
        while (this.ajaxInstances.length > 0) {
            this.ajaxInstances[0].abort();
            this.ajaxInstances.splice(0, 1);
        }
        // Set all files state in queue cancelled
        for (n = 0, l = this.files.length; n < l; n++) {
            file = this.files[n];

            if (file.state < FileUploadSource.STATE_CANCELLED) {
                file.state = FileUploadSource.STATE_CANCELLED;
                if (types.isFunction(file.onChangeState)) {
                    file.onChangeState(file.state);
                }
            }
        }

        return this;
    }
    /**
     * Abort upload on a specified file
     * @method abortFile
     * @param {File} file - file that we want to cancel uploading
     * @return {fw/source/FileUploadSource}
     */
    abortFile(file) {
        // Set the file in cancelled state if this file exists in the queue
        if (this.files.indexOf(file) !== -1) {

            if (file.ajaxInstance) {
                file.ajaxInstance.abort();
            }

            if (file.state < FileUploadSource.STATE_CANCELLED) {
                file.state = FileUploadSource.STATE_CANCELLED;
                if (types.isFunction(file.onChangeState)) {
                    file.onChangeState(file.state);
                }
            }
        }

        return this;
    }
}

Object.defineProperties(FileUploadSource, {
    STATE_WAITING:     { value: 0 },
    STATE_IN_PROGRESS: { value: 1 },
    STATE_UPLOADED:    { value: 2 },
    STATE_CANCELLED:   { value: 3 },
    STATE_SUCCESSFUL:  { value: 4 },
    STATE_ERROR:       { value: 5 }
});

module.exports = FileUploadSource;
