/**
 * VDM Uikit Uploader v2.0.5
 * https://git.vdm.dev/joomla/uikit
 * (c) 2020 - 2024 Llewellyn van der Merwe
 * MIT License
 **/

(function () {
    'use strict';

    /**
     * `UploadHelper` is a utility class that simplifies operations related to file uploading.
     * It handles the storage and retrieval of metadata associated with each upload and initializes
     * the upload process by setting up endpoint configuration. It also provides methods for
     * triggering the upload activities in an asynchronous manner.
     *
     * @class
     * @example
     * const helper = new UploadHelper('http://example.com/upload');
     * const uniqueId = 'file123';
     * const globalId = 'glob124';
     * const data = { user: 'John Doe', file: 'myfile.txt' };
     *
     * helper.set(uniqueId, data);
     * await helper.init(uniqueId, globalId);
     */
    class UploadHelper {
        /**
         * The endpoint to which files would be uploaded.
         * Stored as a private property and used internally within the class methods.
         * This field must be a string representing a valid URL.
         *
         * @type {string}
         * @private
         */
        #endpoint;

        /**
         * It is a private object used to store the data associated with an instance of `UploadHelper`.
         * Default is an empty object.
         * This data is used when performing uploads.
         *
         * @type {Object}
         * @private
         */
        #data = {};

        /**
         * Constructor for the UploadHelper class.
         *
         * @param {string} endpoint - The endpoint to be associated with the instance of the UploadHelper.
         */
        constructor(endpoint) {
            // Initialize private field with passed endpoint argument
            this.#endpoint = endpoint;
        }

        /**
         * Stores a value associated with a provided key in data or merges an input object with the data.
         *
         * @param {string} id - The unique identifier associated with the data to store.
         * @param {string|object} keyOrObject - The key to associate with a value within the provided identifier or an object to merge with the data.
         * @param {any} [value=null] - The value to set for the specific key. Only used if keyOrObject isn't an object. Defaults to null.
         */
        set = (id, keyOrObject, value = null) => {
            // Initialize data object for the ID if it does not exist
            this.#data[id] = this.#data[id] || {};

            if (typeof keyOrObject === 'object') {
                // If keyOrObject is an object, merge it with the existing data for the provided ID
                Object.assign(this.#data[id], keyOrObject);
            } else {
                // If keyOrObject is not an object, treat it as a key and associate it with the provided value in the data
                this.#data[id][keyOrObject] = value;
            }
        };

        /**
         * Retrieves the value for a specific key from data.
         *
         * @param {string} id - The unique identifier associated with the data.
         * @param {string|null} [key=null] - The key whose associated value to return from within the identified data. If not specified,
         *                              the entire data object associated with the identifier will be returned instead.
         * @param {any} [defaultValue=null] - The value to return if the key or identifier is not found in the data. Defaults to null.
         * @returns {any} The value associated with the provided key if found, the data object
         *                if only an identifier is provided, or the default value if the key or
         *                identifier cannot be found in the data.
         */
        get = (id, key = null, defaultValue = null) => {
            const idData = this.#data[id];

            if (!idData) {
                // If the ID does not exist in the data, return the default value
                return defaultValue;
            }

            if (key === null) {
                // If no specific key is specified, return the entire data object for the ID
                return idData;
            }

            // If the key exists in the data object, return its value; otherwise, return the default value
            return idData[key] ?? defaultValue;
        };

        /**
         * Asynchronously initializes the UploadHelper object.
         *
         * @param {string} id - The unique identifier associated with the initialization.
         * @param {string} guid - The globally unique identifier used to build the URL for fetching.
         * @param {boolean} reset - A flag indicating whether to reset the initialization. Defaults to false.
         * @return {Promise.<void>} Returns promise which resolves when operation is complete.
         *                          There is no resolved value but any error occurred while
         *                          operation will be thrown.
         */
        init = async (id, guid, reset = false) => {
            if (this.#data[id] && !reset) {
                return;
            }

            try {
                const url = this.#buildUrl(this.#endpoint, guid);
                const { DEBUG } = process.env;

                const result = await this.#fetchData(url);

                DEBUG === 'true' && console.log('Data fetched:', result);

                if (result?.data && typeof result.data === 'object') {
                    this.set(id, result.data);
                } else if (result?.error) {
                    throw new Error(result.error || 'An error occurred during the file type request.');
                }
            } catch (error) {
                DEBUG === 'true' && console.error('Error during initialization:', error);
            }
        };

        /**
         * Fetches data from provided URL.
         *
         * @param {string} url - The URL from which the data should be fetched.
         * @return {Promise.<Object|undefined>} Returns fetched data or undefined if data fetch was unsuccessful.
         */
        #fetchData = async url => {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                return;
            }

            return await response.json();
        };

        /**
         * Retrieves values associated with a provided list of identifiers from the DOM.
         *
         * @param {Array.<string>} ids - The list of identifiers associated to DOM fields to retrieve values from.
         * @returns {Object.<string, string>} An object containing the values of the fields with its id as properties' names.
         */
        getParams = ids => {
            // Initialize a params object to hold our field values
            const params = {};

            // Use early return if ids is not an array or is an empty array
            if (!Array.isArray(ids) || ids.length === 0) {
                return params;
            }

            // Using forEach method on the ids array to populate the params object
            ids.forEach(id => {
                // Get the DOM field for the current id
                const field = document.getElementById(id);

                // If the field exists, add its value to params object using id as the key
                if (field) {
                    params[id] = field.value;
                }
            });

            // Return the params object, which now contains the field values
            return params;
        };

        /**
         * Builds a URL appending a unique identifier as a parameter.
         *
         * @param {string} endpoint - The base endpoint of the URL.
         * @param {string} guid - The globally unique identifier to append to the URL.
         * @returns {string} The constructed URL with the appended unique identifier.
         * @private
         */
        #buildUrl = (endpoint, guid) => {
            // Determine the appropriate separator for the query parameter
            const separator = endpoint.includes('?') ? '&' : '?';

            // Return the constructed URL
            return `${endpoint}${separator}guid=${guid}`;
        };
    }

    /**
     * The `DisplayHelper` class assists with fetching HTML content from a specified endpoint
     * and injecting it into a specified DOM area.
     * It constructs the endpoint URL, fetches the HTML, and manages filling/clearing the DOM area.
     *
     * @class
     * @example
     * const helper = new DisplayHelper();
     * const endpoint = 'http://example.com/data';
     * const area = document.getElementById('displayArea');
     * const params = { user: 'John Doe', limit: 10 };
     *
     * await helper.set(endpoint, area, params);
     */
    class DisplayHelper {
        constructor() {}

        /**
         * Asynchronously fetches HTML content from a specified endpoint and injects it into a specified DOM area.
         * If any error occurs during this operation and the debug mode is enabled, the error will be logged to the console.
         * The display area is emptied when any error occurs or if the fetched content is empty.
         *
         * @async
         * @param {string} displayEndpoint - The endpoint from which the HTML content is fetched.
         * @param {HTMLElement} displayArea - The DOM element wherein the fetched content is to be injected.
         * @param {object} params - The query parameters to be appended to the endpoint URL.
         * @throws Will throw an error if the fetch operation fails.
         */
        set = async (displayEndpoint, displayArea, params) => {
            try {
                // Build the URL with the query parameters
                const url = this.#buildUrl(displayEndpoint, params);

                // Fetch the HTML content from the displayEndpoint
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    // If an error occurs, log it in debug mode
                    if (true === 'true') ;
                    return;
                }

                const result = await response.json();

                // If there's no response.data or it's empty, clear the display area
                if (!result.data || result.data.trim() === '') {
                    displayArea.innerHTML = ''; // Empty the display area
                } else {
                    // Replace the display area content with the new HTML
                    displayArea.innerHTML = result.data;
                }

            } catch (error) {

                // Optionally, you can clear the display area on error
                displayArea.innerHTML = ''; // Empty the display area on failure
            }
        };

        /**
         * It's a private method that builds a complete URL from the endpoint and an object containing parameters.
         * It uses the URLSearchParams interface to turn the parameters object to a query string,
         * then, it attaches this string to the endpoint.
         * If endpoint already includes a query string, the parameters string is prefixed with '&' char or else with '?' char.
         *
         * @param {string} endpoint - The base URL to which the parameters should be appended.
         * @param {object} params - The object containing key-value pairs to be converted into a URL query string.
         * @returns {string} The full URL with the appended query parameters.
         * @private
         */
        #buildUrl = (endpoint, params) => {
            // Convert the params object into URL query string using URLSearchParams
            const separator = endpoint.includes('?') ? '&' : '?';
            const urlParams = new URLSearchParams(params);
            return `${endpoint}${separator}${urlParams.toString()}`; // Return the full URL with query params
        };
    }

    /**
     * Helper class for uploading files.
     *
     * @class
     * @classdesc This class provides methods for uploading files to a server.
     */
    class UikitUploader {
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
                        if (true === 'true') ;
                        environment.data.params = this.#uploadHelper.getParams(this.#uploadHelper.get(call, 'param_fields'));
                    },

                    beforeAll: () => {
                        if (true === 'true') ;
                    },

                    load: () => {
                        if (true === 'true') ;
                    },

                    error: (error) => {
                        if (true === 'true') ;
                        if (errorMessage) {
                            errorMessage.removeAttribute('hidden');
                            errorMessage.textContent = 'Upload failed.';
                        }
                    },

                    complete: () => {
                        if (true === 'true') ;
                        if (successMessage) {
                            successMessage.removeAttribute('hidden');
                            successMessage.textContent = 'Upload completed successfully.';
                        }
                    },

                    loadStart: (e) => {
                        if (true === 'true') ;
                        if (bar) {
                            bar.removeAttribute('hidden');
                            bar.max = e.total;
                            bar.value = e.loaded;
                        }
                    },

                    progress: (e) => {
                        if (true === 'true') ;
                        if (bar) {
                            bar.max = e.total;
                            bar.value = e.loaded;
                        }
                    },

                    loadEnd: (e) => {
                        if (true === 'true') ;
                        if (bar) {
                            bar.max = e.total;
                            bar.value = e.loaded;
                        }
                    },

                    completeAll: () => {
                        if (true === 'true') ;
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

    (function(global) {
        document.addEventListener('DOMContentLoaded', function() {
            let UIkitLocal;

            if (!global.UIkit) {
                UIkitLocal = require('uikit').default;
            } else {
                UIkitLocal = global.UIkit;
            }

            const { endpoint, targetClass, ...additionalConfig } = global.vdmUploaderConfig || {};

            if (!endpoint) {
                return;
            }

            if (!targetClass) {
                return;
            }

            const uploadElements = document.querySelectorAll('.' + targetClass);
            const config = {};

            uploadElements.forEach(element => {
                const id = element.getAttribute('id');
                const uploadEndpoint = global.vdmUploaderConfig[id] ? global.vdmUploaderConfig[id].endpoint : null;

                if (!uploadEndpoint) {
                    return; // Skip this field if no upload endpoint is found
                }

                const progressBarId = element.dataset.progressbarId;
                const typeId = element.dataset.typeId;
                // optional
                const displayEndpoint = global.vdmUploaderConfig[id] ? global.vdmUploaderConfig[id].endpoint_diplay : null;
                const displayId = element.dataset.displayId || null;
                const successId = element.dataset.successId || null;
                const errorId = element.dataset.errorId || null;
                const allowedFormatId = element.dataset.allowedFormatId || null;
                const fileTypeId = element.dataset.fileTypeId || null;

                config[id] = {
                    bar: progressBarId,
                    typeId: typeId,
                    endpoint: uploadEndpoint,
                    successId: successId,
                    errorId: errorId,
                    allowedFormatId: allowedFormatId,
                    fileTypeId: fileTypeId,
                    displayId: displayId,
                    displayEndpoint: displayEndpoint
                };
            });

            if (Object.keys(config).length > 0) {
                new UikitUploader(config, endpoint, UIkitLocal);
            }
        });
    })(window);

})();
