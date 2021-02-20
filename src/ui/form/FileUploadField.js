/**
 * @module fw/ui/form/FileUploadField
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../../Core');
var FocusableElement = require('../FocusableElement');
var FileUploadSource = require('../../source/FileUploadSource');
var I18n = require('../i18n/I18n');
var i18nForm = require('../../nls/form');
var KeyboardManager = require('../KeyboardManager');

/**
 * Create an UI file upload field element
 * @class
 * @alias module:/fw/ui/form/FileUploadField
 * @augments fw/ui/form/FileUploadField
 * @param {Object} [config] - the configuration object of the file upload field
 * @param {fw/source/FileUploadSource} [config.fileUploadSource]
 * @param {boolean} [config.multiple] - allow multiple files uploading
 * @param {boolean} [config.disabled] - set the file upload field disabled
 * @param {boolean} [config.autoUpload=true] - upload files when dropping to the upload field element
 */
class FwFileUploadField extends FocusableElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-fileuploadfield'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-fileuploadfield'; // jshint ignore:line
    /**
     * Define the i18n dictionaries
     * @property i18n
     */
    static i18n = i18nForm; 
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */  
    initialize() {
        this.value = null;
        this.multiple = this.config.multiple || false;
        this.disabled = this.config.disabled || false;
        this.autoUpload = this.config.autoUpload || true;
        // Define a fileUploadSource
        this.setFileUploadSource(this.config.fileUploadSource || this.fileUploadSource);
    }
    /**
     * Create the FileUploadField nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.innerHTML = '\
            <div class="fw-fileuploadfield-action">\
                <input type="file"></input>\
                <div tabIndex="0" class="fw-fileuploadfield-choice"></div>\
            </div>\
            <div class="fw-fileuploadfield-view">\
                 <table><tbody></tbody></table>\
            </div>';
        this.choiceNode = this.node.getElementsByClassName('fw-fileuploadfield-choice')[0];
        this.inputNode = this.node.getElementsByTagName('input')[0];
        this.bodyNode = this.node.getElementsByTagName('tbody')[0];
        this.viewNode = this.node.getElementsByClassName('fw-fileuploadfield-view')[0];
        this.setMultiple(this.multiple);
        this.setFocusableNode(this.choiceNode);
    }
    /**
     * Bind events to the node
     * @method bindUI
     * @private
     */
    bindUI() {
        super.bindUI();

        this.on('focus', this.onFocus);
        this.on('blur', this.onBlur);
        this.on('keydown', this.onKeyDown);
        this.on('keyup', this.onKeyUp);
        this.on('mousedown', this.onMouseDown);
        this.on(['mouseup', 'mousedown'], this.deactivate);
        this.on('drop', this.onDrop);
        this.on('dragover', this.onDragOver, false);
        this.on('dragleave', this.onDragLeave, false);
        this.on('click', this.onClick);
        this.on('change', this.onChange);

        this.onAttributeChange('autoupload', this.setAutoUpload);
        this.onAttributeChange('multiple', this.setMultiple);
    }
    /**
     * focus event handler
     * @method onFocus
     * @private
     */
    onFocus() {
        this.addClass('focused');
    }
    /**
     * blur event handler
     * @method onBlur
     * @private
     */ 
    onBlur() {
        this.removeClass('focused');
        this.choiceNode.classList.remove('activated');
    }
    /**
     * keydown event handler
     * @method onKeyDown
     * @private
     */
    onKeyDown(e) {
        if (KeyboardManager.isActive('ENTER') || KeyboardManager.isActive('SPACE')) {
            this.choiceNode.classList.add('activated');
            this.inputNode.value = '';
            this.inputNode.click();
            e.preventDefault();
        } else if (KeyboardManager.isActive(['CTRL', 'z'])) {
            e.preventDefault();
        }
    }
    /**
     * keyup event handler
     * @method onKeyUp
     * @private
     */
    onKeyUp() {
        this.choiceNode.classList.remove('activated');
    }
    /**
     * mousedown event handler
     * @method onMouseDown
     * @private
     */
    onMouseDown(e) {
        if (e.target === this.choiceNode) {
            this.choiceNode.classList.add('activated');
        }
    }
    /**
     * dragleave event handler
     * @method onDragLeave
     * @private
     */
    onDragLeave(e) {
        e.stopPropagation();
        e.preventDefault();
        this.removeClass('over');
    }
    /**
     * dragover event handler
     * @method onDragOver
     * @private
     */
    onDragOver(e) {
        e.stopPropagation();
        e.preventDefault();

        if (!this.disabled) {
            this.addClass('over');
        }
    }
    /**
     * drop event handler
     * @method onDrop
     * @private
     */
    onDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        this.removeClass('over');

        if (!this.disabled) {
            if (this.multiple) {
                if (this.autoUpload) {
                    this.sendFiles(e.dataTransfer.files);
                } else {
                    this.attachFiles(e.dataTransfer.files);
                }
            } else {
                if (this.autoUpload) {
                    this.sendFiles(e.dataTransfer.files[0]);
                } else {
                    this.attachFiles(e.dataTransfer.files[0]);
                }
            }
        }
    }
    /**
     * click event handler
     * @method onClick
     * @private
     */
    onClick(e) {
        var row;

        if (e.target === this.choiceNode) {
            if (!this.disabled) {
                this.inputNode.value = '';
                this.inputNode.click();
                e.preventDefault();
            }
        } else if (
            this.node.contains(e.target.parentNode.parentNode) &&
            e.target.parentNode.classList.contains('cancel') &&
            e.target.parentNode.parentNode !== null) {

            row = e.target.parentNode.parentNode;
            this.fileUploadSource.abortFile(row.file);
        }
     }
     /**
      * change event handler
      * @method onChange
      * @private
      */
     onChange(e) {
         if (!this.disabled) {
             if (e.target === this.inputNode) {
                 if (this.multiple) {
                     if (this.autoUpload) {
                         this.sendFiles(this.inputNode.files);
                     } else {
                         this.attachFiles(this.inputNode.files);
                     }
                 } else {
                     if (this.autoUpload) {
                         this.sendFile(this.inputNode.files[0]);
                     } else {
                         this.attachFile(this.inputNode.files[0]);
                     }
                 }
             }
         }
     }
     /**
      * mouseup and mouseout events handler
      * @method deactivate
      * @private
      */
     deactivate() {
         this.choiceNode.classList.remove('activated');
     }
     /**
     * Set the FileUploadSource
     * @method setFileUploadSource
     * @param {fw/source/FileUploadSource} fileUploadSource - fileUploadSource linked to the fileUploadField
     */
    setFileUploadSource(fileUploadSource) {
        var FileUploadSource = require('fw/source/FileUploadSource');

        if (this.fileUploadSource !== fileUploadSource) {
            if (this.fileUploadSource !== null) {
                this.fileUploadSource.unbind();
            }

            if (fileUploadSource instanceof FileUploadSource) {
                fileUploadSource.bind(this);
            } else {
                this.fileUploadSource = null;
            }
        }
    }
    /**
     * Get the FileUploadSource
     * @method getFileUploadSource
     * @returns {fw/source/FileUploadSource}
     */
    getFileUploadSource() {
        return this.fileUploadSource;
    }
    /**
     * Set autoUpload
     * @method setAutoUpload
     * @param {boolean} autoUpload
     */
    setAutoUpload(autoUpload) {
        this.autoUpload = fw.isString(autoUpload) ? autoUpload === 'true' : !!autoUpload;
    }
    /**
     * Set multiple file uploading mode
     * @method setUploadingMode
     * @param {boolean} multiple
     */
    setMultiple(multiple) {
        this.multiple = fw.isString(multiple) ? multiple === 'true' : !!multiple;

        if (this.multiple) {
            this.inputNode.setAttribute('multiple', 'multiple');
            this.viewNode.add('multiple');
        } else {
            this.inputNode.setAttribute('multiple', '');
            this.viewNode.remove('multiple');
        }
    }
    /**
     * Send specified files
     * @method sendFiles
     * @param {File|FileList} files - file(s) to send
     */
    sendFiles(files) {
        this.attachFiles(files);
        this.uploadFiles();
    }
    /**
     * Attach fields to the FileUploadField
     * @method attachFiles
     * @param {File|FileList} files -file(s) to attach
     */
    attachFiles(files) {
        var self = this;
        var n, l, node, nextNode;

        function attachFile(file) {
            var row;

            if (!self.fileUploadSource.appendFile(file)) return;

            row = document.createElement('tr');
            row.file = file;
            row.innerHTML = '<td class="fw-fileuploadfield-filename"><div>' + file.name + '</div></td><td class="fw-fielduploadfield-info"><div class="fw-fileuploadfield-status">' + self.createMessage('waiting') + '</div></td><td class="fw-fileuploadfield-cancel"><div></div></td>';
            self.bodyNode.appendChild(row);

            file.onChangeState = function(state) {
                var infoNode = row.childNodes[1];
                var cancelNode = row.childNodes[2];
                var progressBarNode, fullNode;

                switch (state) {
                    case FileUploadSource.STATE_IN_PROGRESS:
                        progressBarNode = infoNode.childNodes[0];

                        if (progressBarNode !== undefined && progressBarNode.classList.contains('progressBar')) {
                            fullNode = progressBarNode.firstElementChild;
                        } else {
                            fw.emptyNode(infoNode);
                            progressBarNode = document.createElement('div');
                            progressBarNode.classList.add('fw-fileuploadfield-progressbar');
                            infoNode.appendChild(progressBarNode);
                            fullNode = document.createElement('div');
                            fullNode.classList.add('fw-fileuploadfield-full');
                            progressBarNode.appendChild(fullNode);
                            cancelNode.innerHTML = '<div></div>';
                        }

                        fullNode.style.width = String(file.progress) + '%';
                        break;
                    case FileUploadSource.STATE_UPLOADED:
                        infoNode.innerHTML = '<div class="fw-fileuploadfield-status">' + self.createMessage('uploaded') + '</div>';
                        fw.emptyNode(cancelNode);
                        break;
                    case FileUploadSource.STATE_SUCCESSFUL:
                        infoNode.innerHTML = '<div class="fw-fileuploadfield-status successful">' + self.createMessage('successful') + '</div>';
                        fw.emptyNode(cancelNode);
                        break;
                    case FileUploadSource.STATE_CANCELLED:
                        infoNode.innerHTML = '<div class="fw-fileuploadfield-status">' + self.createMessage('cancelled') + '</div>';
                        fw.emptyNode(cancelNode);
                        break;
                    case FileUploadSource.STATE_ERROR:
                        infoNode.innerHTML = '<div class="fw-fileuploadfield-status error">' + self.createMessage('error') + '</div>';
                        fw.emptyNode(cancelNode);
                        break;
                }
            };
        }

        if (this.fileUploadSource === null) return;

        if (this.bodyNode.hasChildNodes()) {
            node = this.bodyNode.firstElementChild;

            do {
                nextNode = node.nextElementSibling;
                if (node.file.state > FileUploadSource.STATE_UPLOADED) {
                    this.bodyNode.removeChild(node);
                }
            } while ((node = nextNode) !== null);
        }

        if (files instanceof File) {
            attachFile(files);
        } else if (files instanceof FileList) {
            for (n = 0, l = files.length; n < l; n++) {
                attachFile(files[n]);
            }
        }
    }
    /**
     * Upload all attached files
     * @method uploadFiles
     */
    uploadFiles() {
        if (this.fileUploadSource === null) return;
        this.fileUploadSource.upload();
    }
    /**
     * Reset the FileUploadField
     * @method reset
     */
    reset() {
        if (this.fileUploadSource === null) return;
        this.fileUploadSource.abort();
        fw.emptyNode(this.bodyNode);
    }
}

module.exports = FwFileUploadField;
