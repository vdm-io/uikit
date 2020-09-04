import {UploadHelper} from './UploadHelper.js';
import {DisplayHelper} from './DisplayHelper.js';

/**
 * Helper class for uploading files.
 *
 * @class
 * @classdesc This class provides methods for uploading files to a server.
 */
export class UikitUploader {
    /**
     * Helper class for uploading files.
     *
     * @class
     * @classdesc This class provides methods for uploading files to a server.
     */
    #uploadHelper;

    /**
     * Helper object for displaying messages and data in the user interface.
     *
     * @namespace displayHelper
     */
    #displayHelper;

    /**
     * @typedef {Object} UIKit
     *
     */
    #uikit;

    /**
     * Object representing the upload instances.
     *
     * @typedef {Object} UploadInstances
     * @property {Object} - The key-value pairs of upload instance IDs and their corresponding upload data.
     */
    #uploadInstances = {};

    /**
     * Creates an instance of the UikitUploader class.
     *
     * @param {Object} config - An object that contains configuration details.
     * @param {any} endpoint - Endpoint where the upload is being sent.
     * @param {any} uikit - Reference to uikit.
     */
    constructor(config, endpoint, uikit) {
        this.#uploadHelper = new UploadHelper(endpoint);
        this.#displayHelper = new DisplayHelper();
        this.#uikit = uikit;

        Object.keys(config).forEach(id => {
            const entity = config[id];
            this.#initField(id, entity);
        });
    }

    /**
     * Initializes a field with given parameters and sets up its event listener.
     *
     * @param {string} id - The identifier for the field.
     * @param {Object} entity - An object containing various field parameters.
     *      entity must contain 'bar', 'typeId', 'endpoint', 'successId', 'errorId', 'allowedFormatId', 'fileTypeId', 'displayId', 'displayEndpoint' properties.
     */
    #initField = (id, entity) => {
        const {
            bar, typeId, endpoint, successId, errorId, allowedFormatId, fileTypeId, displayId, displayEndpoint
        } = entity;
        const typeField = document.getElementById(typeId);

        const errorNotification = {
            message: 'error.message',
            status: 'danger',
            timeout: 7000
        };

        const initializeUpload = async guid => {
            if (guid && guid.length > 1) {
                try {
                    await this.#initUpload(id, guid, bar, endpoint, successId,
                        errorId, allowedFormatId, fileTypeId, displayId, displayEndpoint);
                } catch (error) {
                    errorNotification.message = error.message;
                    this.#uikit.notification(errorNotification);
                }
            }
        };

        if (!typeField) {
            if (process.env.DEBUG === 'true') console.error(`Type field with ID ${typeId} not found`);
            return;
        }

        typeField.addEventListener('change', async () => await initializeUpload(typeField.value));

        initializeUpload(typeField.value).catch(error => {
            errorNotification.message = error.message;
            this.#uikit.notification(errorNotification);
        });
    };

    /**
     * Initializes the upload process in the specified field after setting up the corresponding html elements and their interactions.
     *
     * @param {string} id - The identifier for the field.
     * @param {string} typeGuid - The typeGuid for the field.
     * @param {string} progressBarId - The id of the progress bar element.
     * @param {string} uploadEndpoint - The endpoint url to which file is being uploaded.
     * @param {string|null} successId - The id of the success message element.
     * @param {string|null} errorId - The id of the error message element.
     * @param {string|null} allowedFormatId - The id of the allowed format element.
     * @param {string|null} fileTypeId - The id of the file type element.
     * @param {string|null} displayId - The id of the display element.
     * @param {string|null} displayEndpoint - The endpoint url from where the file is being displayed.
     */
    #initUpload = async (id, typeGuid, progressBarId, uploadEndpoint, successId,
                         errorId, allowedFormatId, fileTypeId, displayId, displayEndpoint) => {
        try {
            const call = id + typeGuid;

            await this.#uploadHelper.init(call, typeGuid);

            const bar = document.getElementById(progressBarId);
            const successMessage = document.getElementById(successId);
            const errorMessage = document.getElementById(errorId);
            const displayArea = document.getElementById(displayId);
            const allowedFormatSpan = document.getElementById(allowedFormatId);
            const fileTypeSpan = document.getElementById(fileTypeId);

            if (this.#uploadInstances[id]) {
                this.#uploadInstances[id].$destroy(true);
            }

            if (successMessage) {
                successMessage.setAttribute('hidden', 'hidden');
            }
            if (errorMessage) {
                errorMessage.setAttribute('hidden', 'hidden');
            }
            if (allowedFormatSpan) {
                allowedFormatSpan.textContent = this.#uploadHelper.get(call, 'allow_span', '');
            }
            if (fileTypeSpan) {
                allowedFormatSpan.textContent = this.#uploadHelper.get(call, 'file_type_span', 'file');
            }
            if (displayEndpoint && displayArea) {
                this.#displayHelper.set(
                    displayEndpoint,
                    displayArea,
                    this.#uploadHelper.getParams(
                        this.#uploadHelper.get(call, 'display_fields')
                    )
                );
            }

            this.#uploadInstances[id] = this.#uikit.upload(`#${id}`, {
                url: this.#buildUrl(uploadEndpoint, typeGuid),
                multiple: true,
                allow: () => this.#uploadHelper.get(call, 'allow') || false,
                name: () => this.#uploadHelper.get(call, 'name') || 'files',

                beforeSend: (environment) => {
                    if (process.env.DEBUG === 'true') console.log('beforeSend', environment);
                    environment.data.params = this.#uploadHelper.getParams(this.#uploadHelper.get(call, 'param_fields'));
                },

                beforeAll: () => {
                    if (process.env.DEBUG === 'true') console.log('beforeAll');
                },

                load: () => {
                    if (process.env.DEBUG === 'true') console.log('load');
                },

                error: (error) => {
                    if (process.env.DEBUG === 'true') console.log('error', error);
                    if (errorMessage) {
                        errorMessage.removeAttribute('hidden');
                        errorMessage.textContent = 'Upload failed.';
                    }
                },

                complete: () => {
                    if (process.env.DEBUG === 'true') console.log('complete');
                    if (successMessage) {
                        successMessage.removeAttribute('hidden');
                        successMessage.textContent = 'Upload completed successfully.';
                    }
                },

                loadStart: (e) => {
                    if (process.env.DEBUG === 'true') console.log('loadStart', e);
                    if (bar) {
                        bar.removeAttribute('hidden');
                        bar.max = e.total;
                        bar.value = e.loaded;
                    }
                },

                progress: (e) => {
                    if (process.env.DEBUG === 'true') console.log('progress', e);
                    if (bar) {
                        bar.max = e.total;
                        bar.value = e.loaded;
                    }
                },

                loadEnd: (e) => {
                    if (process.env.DEBUG === 'true') console.log('loadEnd', e);
                    if (bar) {
                        bar.max = e.total;
                        bar.value = e.loaded;
                    }
                },

                completeAll: () => {
                    if (process.env.DEBUG === 'true') console.log('completeAll');
                    if (bar) {
                        setTimeout(() => {
                            bar.setAttribute('hidden', 'hidden');
                            if (errorMessage) {
                                successMessage.setAttribute('hidden', 'hidden');
                            }
                            if (errorMessage) {
                                errorMessage.setAttribute('hidden', 'hidden');
                            }
                        }, 1000);
                    }
                    if (displayEndpoint && displayArea) {
                        this.#displayHelper.set(
                            displayEndpoint,
                            displayArea,
                            this.#uploadHelper.getParams(
                                this.#uploadHelper.get(call, 'display_fields')
                            )
                        );
                    }
                }
            });
        } catch (error) {
            throw error;
        }
    };

    /**
     * Builds a URL by appending a GUID parameter to the endpoint.
     *
     * @param {string} endpoint - The base URL endpoint
     * @param {string} guid - The GUID parameter value
     * @returns {string} The built URL with the appended GUID parameter
     */
    #buildUrl = (endpoint, guid) => {
        const separator = endpoint.includes('?') ? '&' : '?';
        return `${endpoint}${separator}guid=${guid}`;
    };
}
