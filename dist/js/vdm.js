/**
 * VDM Uikit v3.0.2
 * https://git.vdm.dev/joomla/uikit
 * (c) 2020 - 2025 Llewellyn van der Merwe
 * MIT License
 **/

(function () {
    'use strict';

    /**
     * `FileType` is a utility class that simplifies operations related to file uploading.
     * It handles the storage and retrieval of metadata associated with each upload and initializes
     * the upload process by setting up endpoint configuration. It also provides methods for
     * triggering the upload activities in an asynchronous manner.
     *
     * @class
     * @example
     * const helper = new FileType('http://example.com/upload');
     * const uniqueId = 'file123';
     * const globalId = 'glob124';
     * const data = { user: 'John Doe', file: 'myfile.txt' };
     *
     * helper.set(uniqueId, data);
     * await helper.init(uniqueId, globalId);
     */
    class FileType {
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
         * It is a private object used to store the data associated with an instance of `FileType`.
         * Default is an empty object.
         * This data is used when performing uploads.
         *
         * @type {Object}
         * @private
         */
        #data = {};

        /**
         * Constructor for the FileType class.
         *
         * @param {string} endpoint - The endpoint to be associated with the instance of the FileType.
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
         * Asynchronously initializes the FileType object.
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
                console.log(`Field ${id} is already initialized, reusing existing data.`);
                return;
            }

            try {
                const url = this.#buildUrl(guid);
                const result = await this.#fetchData(url);

                if (true) console.log('Data fetched:', result);

                if (result?.data && typeof result.data === 'object') {
                    this.set(id, result.data);
                } else if (result?.error) {
                    throw new Error(result.error || 'An error occurred during the file type request.');
                }
            } catch (error) {
                console.error('Error during initialization:', error);
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
                headers: {'Content-Type': 'application/json'},
            });

            if (!response.ok) {
                console.error('Error fetching data:', response);
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
         * @param {string} guid - The globally unique identifier to append to the URL.
         * @returns {string} The constructed URL with the appended unique identifier.
         * @private
         */
        #buildUrl = (guid) => {
            // Determine the appropriate separator for the query parameter
            const separator = this.#endpoint.includes('?') ? '&' : '?';

            // Return the constructed URL
            return `${this.#endpoint}${separator}guid=${guid}`;
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
    class Display {
        constructor() {
        }

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
                // Trigger a custom event before hide files display the entity files
                this.#dispatchEvent('beforeGetFilesDisplay', {endpoint: displayEndpoint, element: displayArea, params: params});

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
                    if (true) {
                        console.error('Error fetching display data:', response);
                    }
                    return;
                }

                const result = await response.json();

                // Check if result contains an error
                if (result.error) {
                    // Log the error in debug mode and show a user-friendly message
                    if (true) {
                        console.error('Error fetching display data:', result.error);
                    }
                    return;
                }

                // If there's no response.data or it's empty, clear the display area
                if (!result.data || result.data.trim() === '') {
                    // Trigger a custom event before hide files display the entity files
                    this.#dispatchEvent('beforeHideFilesDisplay', {result: result, element: displayArea});

                    displayArea.innerHTML = ''; // Empty the display area
                    displayArea.setAttribute('hidden', 'hidden');

                    // Trigger a custom event after hide files display the entity files
                    this.#dispatchEvent('afterHideFilesDisplay', {result: result, element: displayArea});
                } else {
                    // Trigger a custom event before displaying the entity files
                    this.#dispatchEvent('beforeFilesDisplay', {result: result, element: displayArea});

                    // Replace the display area content with the new HTML
                    displayArea.innerHTML = result.data;
                    displayArea.removeAttribute('hidden');

                    // Trigger a custom event after displaying the entity files
                    this.#dispatchEvent('afterFilesDisplay', {result: result, element: displayArea});
                }
            } catch (error) {
                // If an error occurs, log it in debug mode
                {
                    console.error('Error fetching display data:', error);
                }
            }
        };

        /**
         * Dispatches a custom event with optional detail data.
         *
         * @param {string} eventName - The name of the event to dispatch.
         * @param {object} [detail={}] - The optional detail data to include with the event.
         * @return {void}
         */
        #dispatchEvent(eventName, detail = {}) {
            document.dispatchEvent(new CustomEvent(`vdm.bootstrap.display.${eventName}`, {detail}));
        }

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
            // If no params or params is empty, return the endpoint as is
            if (!params || Object.keys(params).length === 0) {
                return endpoint;
            }

            // Convert the params object into URL query string using URLSearchParams
            const separator = endpoint.includes('?') ? '&' : '?';
            const urlParams = new URLSearchParams(params);
            return `${endpoint}${separator}${urlParams.toString()}`; // Return the full URL with query params
        };
    }

    const STATUS_TO_CONTEXT = {
        success: 'success',
        primary: 'primary',
        secondary: 'secondary',
        danger: 'danger',
        warning: 'warning',
        info: 'info',
        light: 'light',
        dark: 'dark'
    };

    const STATUS_TO_JOOMLA = {
        success: 'success',
        primary: 'message',
        secondary: 'message',
        danger: 'error',
        warning: 'warning',
        info: 'info',
        light: 'message',
        dark: 'message'
    };

    const DEFAULT_CONTAINER_ID = 'system-message-container';

    /**
     * Bootstrap powered notification helper with Joomla integrations.
     */
    class OctoMeso {
        #containerId;
        #fallbackContainer;

        constructor({containerId = DEFAULT_CONTAINER_ID} = {}) {
            this.#containerId = containerId;
            this.#fallbackContainer = null;
        }

        /**
         * Display a Bootstrap alert style notification.
         *
         * @param {object} options
         * @param {string} options.message
         * @param {string} [options.status='primary']
         * @param {number} [options.timeout=5000]
         * @param {string|null} [options.title=null]
         */
        notification({message, status = 'primary', timeout = 5000, title = null} = {}) {
            if (!message) {
                return;
            }

            if (this.#renderWithJoomla({message, status, timeout, title})) {
                return;
            }

            const context = STATUS_TO_CONTEXT[status] || STATUS_TO_CONTEXT.primary;
            const alert = document.createElement('div');
            alert.className = `alert alert-${context} alert-dismissible fade shadow`;
            alert.setAttribute('role', 'alert');
            alert.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                ${title ? `<h6 class="mb-0 fw-semibold">${title}</h6>` : ''}
                <div>${message}</div>
            </div>
            <button type="button" class="btn-close" aria-label="Close"></button>
        `;

            const closeButton = alert.querySelector('.btn-close');
            closeButton.addEventListener('click', () => this.#dismiss(alert));

            const container = this.#ensureFallbackContainer();
            container.append(alert);
            requestAnimationFrame(() => alert.classList.add('show'));

            if (timeout > 0) {
                setTimeout(() => this.#dismiss(alert), timeout);
            }
        }

        #renderWithJoomla({message, status, timeout, title}) {
            const Joomla = window?.Joomla;
            if (!Joomla || typeof Joomla.renderMessages !== 'function') {
                return false;
            }

            const containerSelector = `#${this.#containerId}`;
            let container = document.querySelector(containerSelector);

            if (!container) {
                container = document.createElement('div');
                container.id = this.#containerId;
                container.className = 'joomla-alert-container position-fixed top-0 end-0 p-3';
                container.style.zIndex = '1080';
                document.body.append(container);
            }

            const messageType = STATUS_TO_JOOMLA[status] || STATUS_TO_JOOMLA.primary;
            const content = title ? `<strong>${title}</strong> ${message}` : message;

            Joomla.renderMessages({[messageType]: [content]}, containerSelector);

            if (timeout > 0) {
                setTimeout(() => {
                    if (typeof Joomla.removeMessages === 'function') {
                        Joomla.removeMessages(containerSelector);
                    } else {
                        this.#clearContainer(container);
                    }
                }, timeout);
            }

            return true;
        }

        #clearContainer(container) {
            const alerts = container?.querySelectorAll('.alert');
            alerts?.forEach(alert => alert.remove());
        }

        #dismiss(alert) {
            alert.classList.remove('show');
            alert.classList.add('hide');
            setTimeout(() => {
                alert.remove();
            }, 150);
        }

        #ensureFallbackContainer() {
            if (this.#fallbackContainer && document.body.contains(this.#fallbackContainer)) {
                return this.#fallbackContainer;
            }

            const container = document.createElement('div');
            container.dataset.octomesoContainer = 'true';
            container.className = 'position-fixed top-0 end-0 p-3 d-flex flex-column gap-2';
            container.style.zIndex = '1080';
            document.body.append(container);
            this.#fallbackContainer = container;
            return container;
        }
    }

    const MULTIPLE_NAME_SUFFIX = '[]';

    /**
     * Lightweight file uploader that mimics the UIkit upload API while using
     * vanilla XMLHttpRequest calls under the hood. Designed to integrate with the
     * existing UploadFile controller without any external dependency.
     */
    class Octofilo {
        /**
         * Attach upload behaviour to the provided selector.
         *
         * @param {string|HTMLElement|NodeList|HTMLElement[]} selector
         * @param {object} options
         */
        upload(selector, options = {}) {
            const targets = this.#resolveElements(selector);

            if (!targets.length) {
                {
                    console.warn('Octofilo: no upload targets found for selector', selector);
                }
                return;
            }

            targets.forEach(target => this.#bindDropZone(target, options));
        }

        #resolveElements(selector) {
            if (!selector) {
                return [];
            }

            if (typeof selector === 'string') {
                return Array.from(document.querySelectorAll(selector));
            }

            if (selector instanceof Element) {
                return [selector];
            }

            if (selector instanceof NodeList || Array.isArray(selector)) {
                return Array.from(selector).filter(node => node instanceof Element);
            }

            return [];
        }

        #bindDropZone(dropZone, options) {
            dropZone.classList.add('octofilo-dropzone');

            const input = this.#createFileInput(dropZone, options);
            this.#setupBrowse(dropZone, input);
            this.#setupDragAndDrop(dropZone, options, input);

            input.addEventListener('change', (event) => {
                const files = Array.from(event.target.files || []);
                this.#processFiles(files, dropZone, options).finally(() => {
                    input.value = '';
                });
            });
        }

        #createFileInput(dropZone, options) {
            const input = document.createElement('input');
            input.type = 'file';
            input.hidden = true;
            input.tabIndex = -1;

            if (options.multiple) {
                input.multiple = true;
            }

            this.#applyAccept(input, options.allow);

            dropZone.append(input);
            return input;
        }

        #setupBrowse(dropZone, input) {
            dropZone.addEventListener('click', (event) => {
                // Avoid triggering a click when users interact with interactive children
                if (event.target.closest('button, a, input, label, select, textarea')) {
                    return;
                }

                input.dispatchEvent(new MouseEvent('click', {bubbles: false}));
            });
        }

        #setupDragAndDrop(dropZone, options, input) {
            const highlight = () => dropZone.classList.add('octofilo-dropzone--hover');
            const clearHighlight = () => dropZone.classList.remove('octofilo-dropzone--hover');

            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, event => {
                    event.preventDefault();
                    event.stopPropagation();
                    highlight();
                });
            });

            ['dragleave', 'dragend', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, event => {
                    event.preventDefault();
                    event.stopPropagation();
                    clearHighlight();
                });
            });

            dropZone.addEventListener('drop', event => {
                const files = Array.from(event.dataTransfer?.files || []);

                if (files.length === 0) {
                    return;
                }

                this.#processFiles(files, dropZone, options);
            });
        }

        #applyAccept(input, allow) {
            if (!allow) {
                input.removeAttribute('accept');
                return;
            }

            const rules = this.#normaliseAllow(allow).filter(Boolean);

            if (rules.length === 0) {
                input.removeAttribute('accept');
                return;
            }

            const acceptList = rules
                .map(rule => {
                    if (rule.startsWith('.')) {
                        return rule;
                    }
                    if (!rule.includes('/') && !rule.startsWith('.')) {
                        return `.${rule.replace(/^\*\.?/, '')}`;
                    }
                    return rule;
                })
                .join(',');

            input.setAttribute('accept', acceptList);
        }

        #normaliseAllow(allow) {
            if (Array.isArray(allow)) {
                return allow.flatMap(item => this.#normaliseAllow(item));
            }

            if (typeof allow === 'string') {
                return allow
                    .split(/[|,]/)
                    .map(rule => rule.trim())
                    .filter(Boolean);
            }

            return [];
        }

        async #processFiles(files, dropZone, options) {
            if (!files.length || !options.url) {
                return;
            }

            const {allowed, rejected} = this.#filterFiles(files, options.allow);

            if (rejected.length && typeof options.error === 'function') {
                const error = new Error('Some files were rejected because their type is not permitted.');
                error.files = rejected;
                options.error(error);
            }

            if (!allowed.length) {
                return;
            }

            if (typeof options.beforeAll === 'function') {
                options.beforeAll(allowed);
            }

            let lastResponse = null;

            for (const file of allowed) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    lastResponse = await this.#uploadSingleFile(file, dropZone, options);
                } catch (error) {
                    // Errors are reported via the error callback; continue with remaining files.
                }
            }

            if (typeof options.completeAll === 'function') {
                options.completeAll(lastResponse);
            }
        }

        #filterFiles(files, allow) {
            const rules = this.#normaliseAllow(allow);

            if (!rules.length) {
                return {allowed: files, rejected: []};
            }

            const allowed = [];
            const rejected = [];

            files.forEach(file => {
                if (this.#isAllowed(file, rules)) {
                    allowed.push(file);
                } else {
                    rejected.push(file);
                }
            });

            return {allowed, rejected};
        }

        #isAllowed(file, rules) {
            if (!rules.length) {
                return true;
            }

            const fileType = (file.type || '').toLowerCase();
            const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';

            return rules.some(ruleRaw => {
                const rule = ruleRaw.toLowerCase();

                if (rule === '*' || rule === '*/*') {
                    return true;
                }

                if (rule.endsWith('/*')) {
                    const prefix = rule.replace('/*', '');
                    return fileType.startsWith(`${prefix}/`);
                }

                if (rule.includes('/')) {
                    return fileType === rule;
                }

                const cleaned = rule.replace(/^[*.]+/, '');
                return cleaned === extension;
            });
        }

        #uploadSingleFile(file, dropZone, options) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', options.url, true);

                const formData = new FormData();
                const environment = {
                    data: {params: {}},
                    file,
                    formData,
                    element: dropZone,
                    xhr,
                    withCredentials: false,
                    headers: new Map(),
                };

                if (typeof options.beforeSend === 'function') {
                    try {
                        options.beforeSend(environment);
                    } catch (error) {
                        {
                            console.error('Octofilo beforeSend handler failed', error);
                        }
                    }
                }

                const fieldName = this.#resolveFieldName(options.name, Boolean(options.multiple));
                formData.append(fieldName, file);

                const params = environment.data?.params || {};
                Object.keys(params).forEach(key => {
                    const value = params[key];

                    if (value === undefined || value === null) {
                        return;
                    }

                    if (Array.isArray(value)) {
                        value.forEach(item => formData.append(`${key}${MULTIPLE_NAME_SUFFIX}`, item));
                    } else {
                        formData.append(key, value);
                    }
                });

                if (environment.withCredentials) {
                    xhr.withCredentials = true;
                }

                environment.headers.forEach((value, key) => {
                    xhr.setRequestHeader(key, value);
                });

                if (typeof options.loadStart === 'function') {
                    xhr.upload.addEventListener('loadstart', options.loadStart);
                }

                if (typeof options.progress === 'function') {
                    xhr.upload.addEventListener('progress', options.progress);
                }

                if (typeof options.loadEnd === 'function') {
                    xhr.upload.addEventListener('loadend', options.loadEnd);
                }

                xhr.addEventListener('load', event => {
                    if (typeof options.load === 'function') {
                        options.load(event);
                    }

                    if (typeof options.complete === 'function') {
                        options.complete(xhr);
                    }

                    resolve(xhr);
                });

                xhr.addEventListener('error', () => {
                    const error = new Error('Upload failed.');
                    if (typeof options.error === 'function') {
                        options.error(error);
                    }
                    reject(error);
                });

                xhr.send(formData);
            });
        }

        #resolveFieldName(name, multiple) {
            if (!name) {
                return multiple ? `files${MULTIPLE_NAME_SUFFIX}` : 'file';
            }

            if (multiple && !name.endsWith(MULTIPLE_NAME_SUFFIX)) {
                return `${name}${MULTIPLE_NAME_SUFFIX}`;
            }

            return name;
        }
    }

    // Provide minimal styling hooks for drag and drop feedback when Bootstrap utilities are present.
    const styleId = 'octofilo-style';

    if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
.octofilo-dropzone { cursor: pointer; position: relative; }
.octofilo-dropzone--hover { outline: 2px dashed var(--bs-primary, #0d6efd); outline-offset: 4px; }
`;
        document.head.appendChild(style);
    }

    /**
     * Class for uploading files.
     *
     * @class
     * @classdesc This class provides methods for uploading files to a server.
     */
    class UploadFile {
        /**
         * Utility class for uploading files.
         *
         * @class
         */
        #fileType;

        /**
         * Helper class for displaying elements on the UI.
         *
         * @class
         */
        #display;

        /**
         * Bootstrap powered notification helper.
         */
        #notifier;

        /**
         * Upload helper provided by Octofilo.
         */
        #uploader;

        /**
         * Creates an instance of the UploadFile class.
         *
         * @param {Object} config - Configuration details for uploader instances.
         * @param {string} endpoint - The endpoint where the files will be uploaded.
         * @param {object} [options]
         * @param {object} [options.uploader]
         * @param {OctoMeso} [options.notifier]
         */
        constructor(config, endpoint, {uploader = null, notifier = null} = {}) {
            this.#fileType = new FileType(endpoint);
            this.#display = new Display();
            this.#notifier = notifier instanceof OctoMeso ? notifier : new OctoMeso();
            this.#uploader = this.#resolveUploader(uploader);

            this.#initializeFields(config);
        }

        /**
         * Resolve the uploader dependency or throw if unavailable.
         *
         * @param {object|function|null} providedUploader
         * @returns {object}
         */
        #resolveUploader(providedUploader) {
            let uploader = providedUploader;

            if (typeof uploader === 'function') {
                uploader = new uploader();
            }

            if (!uploader) {
                uploader = this.#detectGlobalUploader();
            }

            if (!uploader) {
                uploader = new Octofilo();
            }

            if (typeof uploader === 'function') {
                uploader = new uploader();
            }

            if (uploader && typeof uploader.upload === 'function') {
                return uploader;
            }

            throw new Error('Octofilo uploader is required. Please provide the dependency or ensure it is available globally.');
        }

        #detectGlobalUploader() {
            const globalScope = typeof globalThis !== 'undefined' ? globalThis : window;
            const globalUploader = globalScope?.Octofilo ?? globalScope?.octofilo;

            if (typeof globalUploader === 'function') {
                try {
                    return new globalUploader();
                } catch (error) {
                    {
                        console.error('Failed to initialise the global Octofilo uploader.', error);
                    }
                }
            }

            if (globalUploader && typeof globalUploader.upload === 'function') {
                return globalUploader;
            }

            return null;
        }

        /**
         * Initializes all upload fields based on the config.
         *
         * @param {Object} config - Configuration object mapping field IDs to their parameters.
         */
        #initializeFields(config) {
            Object.keys(config).forEach(id => {
                this.#initField(id, config[id]);
            });
        }

        /**
         * Initializes a field with given parameters and sets up its event listener.
         *
         * @param {string} id - The identifier for the field.
         * @param {Object} entity - Configuration parameters for the field.
         */
        #initField(id, entity) {
            const {
                bar, typeId, endpoint, successId, errorId, allowedFormatId, fileTypeId, displayId, displayEndpoint
            } = entity;

            this.#setupDisplayArea(displayEndpoint, displayId);

            const typeField = document.getElementById(typeId);
            if (!typeField) {
                this.#logError(`Type field with ID ${typeId} not found`);
                return;
            }

            const initializeUpload = async (guid) => {
                if (guid && guid.length > 1) {
                    try {
                        await this.#initUpload(id, guid, bar, endpoint, successId, errorId, allowedFormatId, fileTypeId, displayId, displayEndpoint);
                    } catch (error) {
                        this.#showNotification(error.message, 'danger');
                    }
                }
            };

            typeField.addEventListener('change', () => initializeUpload(typeField.value));
            initializeUpload(typeField.value).catch(error => this.#showNotification(error.message, 'danger'));
        }

        /**
         * Initializes the upload process and sets up the UI elements.
         *
         * @param {string} id - The identifier for the field.
         * @param {string} typeGuid - The type GUID for the field.
         * @param {string} progressBarId - The ID of the progress bar element.
         * @param {string} uploadEndpoint - The endpoint URL for the upload.
         * @param {string|null} successId - The ID of the success message element.
         * @param {string|null} errorId - The ID of the error message element.
         * @param {string|null} allowedFormatId - The ID of the allowed format element.
         * @param {string|null} fileTypeId - The ID of the file type element.
         * @param {string|null} displayId - The ID of the display element.
         * @param {string|null} displayEndpoint - The endpoint URL for displaying the uploaded file.
         */
        async #initUpload(id, typeGuid, progressBarId, uploadEndpoint, successId, errorId, allowedFormatId, fileTypeId, displayId, displayEndpoint) {
            try {
                this.#dispatchEvent('beforeInit', {
                    id,
                    typeGuid,
                    progressBarId,
                    uploadEndpoint,
                    successId,
                    errorId,
                    allowedFormatId,
                    fileTypeId,
                    displayId,
                    displayEndpoint
                });

                const call = `${id}${typeGuid}`;
                await this.#fileType.init(call, typeGuid, true);

                const elements = this.#getUploadElements(progressBarId, successId, errorId, allowedFormatId, fileTypeId, displayId);

                this.#dispatchEvent('afterElementsInit', {...elements});

                this.#prepareUploadUI(elements, call, successId, errorId);

                this.#uploader.upload(`#${id}`, {
                    url: this.#buildUrl(uploadEndpoint, typeGuid),
                    multiple: true,
                    allow: this.#fileType.get(call, 'allow', false),
                    name: this.#fileType.get(call, 'name', 'files'),
                    beforeSend: (env) => this.#handleBeforeSend(call, env),
                    beforeAll: (files) => this.#dispatchEvent('beforeAll', {files}),
                    load: (e) => this.#dispatchEvent('load', {event: e}),
                    error: (error) => this.#handleUploadError(error, elements.errorMessage),
                    complete: (xhr) => this.#handleComplete(xhr, elements.successMessage),
                    loadStart: (e) => this.#handleLoadStart(e, elements.progressBar),
                    progress: (e) => this.#handleProgress(e, elements.progressBar),
                    loadEnd: (e) => this.#handleLoadEnd(e, elements.progressBar),
                    completeAll: (xhr) => this.#handleCompleteAll(xhr, elements.progressBar, elements.successMessage, elements.errorMessage, displayEndpoint, displayId, call)
                });
            } catch (error) {
                throw error;
            }
        }

        /**
         * Returns the required HTML elements by their IDs.
         * If an element ID is null or the element does not exist on the page,
         * the corresponding value in the returned object will be null.
         *
         * @param {string|null} progressBarId - The ID of the progress bar element, or null.
         * @param {string|null} successId - The ID of the success message element, or null.
         * @param {string|null} errorId - The ID of the error message element, or null.
         * @param {string|null} allowedFormatId - The ID of the allowed format span element, or null.
         * @param {string|null} fileTypeId - The ID of the file type span element, or null.
         * @param {string|null} displayId - The ID of the display area element, or null.
         * @returns {object} - An object containing the required HTML elements or null if they do not exist.
         */
        #getUploadElements(progressBarId, successId, errorId, allowedFormatId, fileTypeId, displayId) {
            return {
                progressBar: progressBarId ? document.getElementById(progressBarId) : null,
                successMessage: successId ? document.getElementById(successId) : null,
                errorMessage: errorId ? document.getElementById(errorId) : null,
                allowedFormatSpan: allowedFormatId ? document.getElementById(allowedFormatId) : null,
                fileTypeSpan: fileTypeId ? document.getElementById(fileTypeId) : null,
                displayArea: displayId ? document.getElementById(displayId) : null
            };
        }

        /**
         * Initializes the display area with data from the display endpoint.
         *
         * @param {string|null} displayEndpoint - The endpoint to retrieve the display data from.
         * @param {string|null} displayId - The id of the display area element in the DOM.
         * @param {object} params - Additional parameters to be passed to the display helper.
         * @return {void}
         */
        #setupDisplayArea(displayEndpoint, displayId, params = {}) {
            const displayArea = displayId ? document.getElementById(displayId) : null;
            if (displayEndpoint && displayArea) {
                this.#display.set(displayEndpoint, displayArea, params);
            }
        }

        /**
         * Displays a notification with the given message and status.
         *
         * @param {string} message - The message to be displayed in the notification.
         * @param {string} status - The status of the notification (e.g., 'success', 'error', 'warning').
         * @return {void} - Does not return a value.
         */
        #showNotification(message, status) {
            this.#notifier.notification({
                message,
                status,
                timeout: 7000
            });
        }

        /**
         * Logs an error to the console.
         *
         * @param {string} message - The error message to be logged.
         *
         * @return {undefined}
         */
        #logError(message) {
            {
                console.error(message);
            }
        }

        /**
         * Dispatches a custom event with optional detail data.
         *
         * @param {string} eventName - The name of the event to dispatch.
         * @param {object} [detail={}] - The optional detail data to include with the event.
         * @return {void}
         */
        #dispatchEvent(eventName, detail = {}) {
            document.dispatchEvent(new CustomEvent(`vdm.bootstrap.uploader.${eventName}`, {detail}));
        }

        /**
         * Builds a URL by appending the GUID parameter.
         *
         * @param {string} endpoint - The base URL endpoint.
         * @param {string} guid - The GUID parameter to be appended to the URL.
         * @return {string} - The constructed URL with the GUID parameter appended.
         */
        #buildUrl(endpoint, guid) {
            const separator = endpoint.includes('?') ? '&' : '?';
            return `${endpoint}${separator}guid=${guid}`;
        }

        /**
         * Prepares the UI elements before starting the upload.
         *
         * @param {object} elements - The UI elements to be modified.
         * @param {string} call - The call identifier.
         * @param {string} successId - The id of the success message element.
         * @param {string} errorId - The id of the error message element.
         */
        #prepareUploadUI(elements, call, successId, errorId) {
            if (elements.successMessage) elements.successMessage.setAttribute('hidden', 'hidden');
            if (elements.errorMessage) elements.errorMessage.setAttribute('hidden', 'hidden');
            if (elements.allowedFormatSpan) elements.allowedFormatSpan.innerHTML = this.#fileType.get(call, 'allow_span', '');
            if (elements.fileTypeSpan) elements.fileTypeSpan.innerHTML = this.#fileType.get(call, 'file_type_span', 'file');
        }

        /**
         * Handles beforeSend logic for uploads.
         *
         * @param {object} call - The call object.
         * @param {object} environment - The environment object.
         * @return {void}
         */
        #handleBeforeSend(call, environment) {
            this.#dispatchEvent('beforeSend', {environment});
            environment.data.params = this.#fileType.getParams(this.#fileType.get(call, 'param_fields'));
            this.#dispatchEvent('afterSendPreparation', {environment});
        }

        /**
         * Handles the error scenario during upload.
         *
         * @param {Error} error - The error object that occurred during upload.
         * @param {HTMLElement} errorMessage - The element used to display the error message.
         *
         * @return {void}
         */
        #handleUploadError(error, errorMessage) {
            this.#dispatchEvent('error', {error});
            if (errorMessage) {
                errorMessage.removeAttribute('hidden');
                errorMessage.textContent = 'Upload failed.';
            }
        }

        /**
         * Handles the upload completion.
         *
         * @param {XMLHttpRequest} xhr - The XMLHttpRequest object representing the upload request.
         * @param {HTMLElement|null} successMessage - The success message element to display.
         */
        #handleComplete(xhr, successMessage) {
            this.#dispatchEvent('complete', {xhr});
            if (successMessage) {
                successMessage.removeAttribute('hidden');
                successMessage.textContent = 'Upload completed successfully.';
            } else {
                this.#showNotification('Upload completed successfully.', 'primary');
            }
        }

        /**
         * Handles the loadStart event.
         *
         * @param {Event} e - The loadStart event object.
         * @param {HTMLElement|null} progressBar - The progress bar element. Optional.
         * @return {void}
         */
        #handleLoadStart(e, progressBar) {
            this.#dispatchEvent('loadStart', {event: e});
            if (progressBar) {
                progressBar.removeAttribute('hidden');
                progressBar.max = e.total;
                progressBar.value = e.loaded;
            }
        }

        /**
         * Handles the progress event.
         *
         * @param {Event} e - The progress event.
         * @param {Element|null} progressBar - The progress bar element.
         *
         * @return {void}
         */
        #handleProgress(e, progressBar) {
            this.#dispatchEvent('progress', {event: e});
            if (progressBar) {
                progressBar.max = e.total;
                progressBar.value = e.loaded;
            }
        }

        /**
         * Handles the loadEnd event.
         *
         * @param {Event} e - The loadEnd event object.
         * @param {Element|null} progressBar - The progress bar element to update.
         *
         * @return {void}
         */
        #handleLoadEnd(e, progressBar) {
            this.#dispatchEvent('loadEnd', {event: e});
            if (progressBar) {
                progressBar.max = e.total;
                progressBar.value = e.loaded;
            }
        }

        /**
         * Handles the completion of all uploads.
         *
         * @param {XMLHttpRequest} xhr - The XMLHttpRequest object used for the uploads.
         * @param {HTMLElement|null} progressBar - The progress bar element.
         * @param {HTMLElement|null} successMessage - The success message element.
         * @param {HTMLElement|null} errorMessage - The error message element.
         * @param {string|null} displayEndpoint - The display endpoint.
         * @param {string|null} displayId - The display ID.
         * @param {Object} call - The call object.
         *
         * @return {void}
         */
        #handleCompleteAll(xhr, progressBar, successMessage, errorMessage, displayEndpoint, displayId, call) {
            this.#dispatchEvent('completeAll', {xhr});
            if (progressBar) {
                setTimeout(() => {
                    progressBar.setAttribute('hidden', 'hidden');
                    if (successMessage) successMessage.setAttribute('hidden', 'hidden');
                    if (errorMessage) errorMessage.setAttribute('hidden', 'hidden');
                }, 5000);
            }
            this.#setupDisplayArea(displayEndpoint, displayId, this.#fileType.getParams(this.#fileType.get(call, 'display_fields')));
        }
    }

    const DEFAULT_TITLE = 'Please Confirm';
    const DEFAULT_CONFIRM = 'Confirm';
    const DEFAULT_CANCEL = 'Cancel';

    /**
     * Bootstrap driven modal helper that falls back to the browser confirm dialog
     * when Bootstrap is unavailable.
     */
    class OctoMoe {
        /**
         * Display a confirmation modal.
         *
         * @param {string} message
         * @param {object} [options]
         * @param {string} [options.title='Please Confirm']
         * @param {string} [options.confirmLabel='Confirm']
         * @param {string} [options.cancelLabel='Cancel']
         * @returns {Promise<void>}
         */
        confirm(message, {title = DEFAULT_TITLE, confirmLabel = DEFAULT_CONFIRM, cancelLabel = DEFAULT_CANCEL} = {}) {
            if (!message) {
                return Promise.resolve();
            }

            if (window?.bootstrap?.Modal) {
                return this.#openBootstrapModal({title, message, confirmLabel, cancelLabel});
            }

            return new Promise((resolve, reject) => {
                if (window.confirm(`${title}\n\n${message}`)) {
                    resolve();
                } else {
                    reject();
                }
            });
        }

        #openBootstrapModal({title, message, confirmLabel, cancelLabel}) {
            return new Promise((resolve, reject) => {
                const modalElement = this.#buildModal({title, message, confirmLabel, cancelLabel});
                document.body.append(modalElement);

                const modalInstance = new window.bootstrap.Modal(modalElement, {
                    backdrop: 'static',
                    keyboard: false
                });

                let resolved = false;

                const cleanup = () => {
                    modalElement.removeEventListener('hidden.bs.modal', hiddenHandler);
                    modalElement.querySelectorAll('[data-action="confirm"]').forEach(button => {
                        button.removeEventListener('click', confirmHandler);
                    });
                    modalElement.querySelectorAll('[data-action="cancel"]').forEach(button => {
                        button.removeEventListener('click', cancelHandler);
                    });
                    modalElement.remove();
                };

                const confirmHandler = () => {
                    resolved = true;
                    resolve();
                    modalInstance.hide();
                };

                const cancelHandler = () => {
                    modalInstance.hide();
                };

                const hiddenHandler = () => {
                    cleanup();
                    if (!resolved) {
                        reject();
                    }
                };

                modalElement.addEventListener('hidden.bs.modal', hiddenHandler);
                modalElement.querySelectorAll('[data-action="confirm"]').forEach(button => {
                    button.addEventListener('click', confirmHandler);
                });
                modalElement.querySelectorAll('[data-action="cancel"]').forEach(button => {
                    button.addEventListener('click', cancelHandler);
                });

                modalInstance.show();
            });
        }

        #buildModal({title, message, confirmLabel, cancelLabel}) {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.tabIndex = -1;
            modal.setAttribute('role', 'dialog');
            modal.innerHTML = `
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-action="cancel" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-0">${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-action="cancel">${cancelLabel}</button>
                        <button type="button" class="btn btn-primary" data-action="confirm">${confirmLabel}</button>
                    </div>
                </div>
            </div>
        `;
            return modal;
        }
    }

    /**
     * Helper class for deleting files from the server.
     *
     * @class
     * @classdesc This class provides methods for deleting files from the server.
     */
    class DeleteFile {
        /**
         * The endpoint to which files would be deleted.
         * Stored as a private property and used internally within the class methods.
         * This field must be a string representing a valid URL.
         *
         * @type {string}
         * @private
         */
        #endpoint;

        /**
         * Bootstrap notification helper.
         */
        #notifier;

        /**
         * Bootstrap modal helper.
         */
        #modal;

        /**
         * The error message that is displayed when the delete endpoint is not configured.
         *
         * @type {string}
         */
        static ERROR_ENDPOINT = 'Error: The delete endpoint is not configured.';

        /**
         * Creates an instance of the DeleteHelper class.
         *
         * @param {string} endpoint - The endpoint where the files will be uploaded.
         * @param {object} [options]
         * @param {OctoMeso} [options.notifier]
         * @param {OctoMoe} [options.modal]
         */
        constructor(endpoint, {notifier = null, modal = null} = {}) {
            this.#endpoint = endpoint;
            this.#notifier = notifier instanceof OctoMeso ? notifier : new OctoMeso();
            this.#modal = modal instanceof OctoMoe ? modal : new OctoMoe();
        }

        /**
         * Deletes a file with the given fileGuid.
         *
         * @param {string} fileGuid - The unique identifier of the file to delete.
         * @param {boolean} [confirm=true] - Whether to show the confirmation modal.
         * @return {void}
         */
        delete(fileGuid, confirm = true) {
            if (!fileGuid || fileGuid.length <= 30) {
                return;
            }

            const executeDelete = () => this.#serverDelete(fileGuid);

            if (!confirm) {
                executeDelete();
                return;
            }

            this.#modal.confirm('Are you sure you want to delete this file! It can not be undone!')
                .then(executeDelete)
                .catch(() => {});
        }

        /**
         * Deletes a file from the server.
         *
         * @param {string} fileGuid - The unique identifier of the file to be deleted.
         * @return {void}
         */
        #serverDelete(fileGuid) {
            if (!this.#endpoint) {
                console.error(DeleteFile.ERROR_ENDPOINT);
                return;
            }

            this.#dispatchEvent('beforeFileDelete', {guid: fileGuid});

            fetch(this.#buildUrl(fileGuid), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(this.#handleResponse.bind(this, fileGuid))
                .catch(console.error);
        }

        /**
         * Handles the response from the server after a file upload.
         * Removes the file from the UI if the response is successful and shows a success notification.
         * Shows an error notification if the response contains an error.
         * @param {string} fileGuid - The unique identifier of the file that was uploaded.
         * @param {object} data - The response data from the server.
         * @return {void}
         */
        #handleResponse(fileGuid, data) {
            if (data.success) {
                this.#fileRemoveFromUI(fileGuid);
                this.#showNotification(data.success, 'primary');
                this.#dispatchEvent('afterFileDelete', {data: data, guid: fileGuid});
            } else if (data.error) {
                this.#dispatchEvent('onFileDeleteError', {data: data, guid: fileGuid});
                this.#showNotification(data.error, 'danger');
            }
        }

        /**
         * Displays a notification with the given message and status.
         *
         * @param {string} message - The message to be displayed in the notification.
         * @param {string} status - The status of the notification (e.g., 'success', 'error', 'warning').
         * @return {void} - Does not return a value.
         */
        #showNotification(message, status) {
            this.#notifier.notification({
                message,
                status,
                timeout: 7000
            });
        }

        /**
         * Remove file from user interface by fileGuid.
         *
         * @param {string} fileGuid - The unique identifier of the file.
         * @example
         * removeFileFromUI('file123')
         *
         * @return {void} - No return value.
         */
        #fileRemoveFromUI(fileGuid) {
            const listItem = document.getElementById(fileGuid);
            if (listItem) {
                this.#dispatchEvent('beforeFileRemoveFromUI', {element: listItem, guid: fileGuid});
                listItem.remove();
            }
        }

        /**
         * Dispatches a custom event with optional detail data.
         *
         * @param {string} eventName - The name of the event to dispatch.
         * @param {object} [detail={}] - The optional detail data to include with the event.
         * @return {void}
         */
        #dispatchEvent(eventName, detail = {}) {
            document.dispatchEvent(new CustomEvent(`vdm.bootstrap.delete.${eventName}`, {detail}));
        }

        /**
         * Builds a URL by appending the GUID parameter.
         *
         * @param {string} guid - The GUID parameter to be appended to the URL.
         * @return {string} - The constructed URL with the GUID parameter appended.
         */
        #buildUrl(guid) {
            const separator = this.#endpoint.includes('?') ? '&' : '?';
            return `${this.#endpoint}${separator}guid=${guid}`;
        }
    }

    (function(global) {
        if (!global.Octofilo) {
            global.Octofilo = Octofilo;
        }

        document.addEventListener('DOMContentLoaded', function() {
            if (!global.VDM) {
                console.error('VDM is not defined, exiting initialization.');
                return;
            }

            const bootstrapConfig = global.VDM.bootstrap || global.VDM.standalone || {};
            const { endpoint_type, target_class, ...additionalConfig } = bootstrapConfig.config || {};

            if (!endpoint_type) {
                console.error('File Type Endpoint is not defined, exiting initialization.');
                return;
            }

            if (!target_class) {
                console.error('The target class is not defined, exiting initialization.');
                return;
            }

            const uploadElements = document.querySelectorAll('.' + target_class);
            const config = {};

            const notifier = new OctoMeso();
            const modal = new OctoMoe();
            const uploader = resolveUploader(global) ?? new Octofilo();

            // Ensure the delete_file namespace exists, or initialize it
            bootstrapConfig.delete_file = bootstrapConfig.delete_file || {};

            if (!global.VDM.bootstrap) {
                global.VDM.bootstrap = bootstrapConfig;
            }
            global.VDM.standalone = bootstrapConfig; // maintain backward compatibility

            uploadElements.forEach(element => {
                const id = element.getAttribute('id');
                const uploadEndpoint = additionalConfig[id]?.endpoint_upload ?? null;

                if (!uploadEndpoint) {
                    console.error(`Upload Endpoint for ${id} is not defined, exiting initialization for this field.`);
                    return; // Skip this field if no upload endpoint is found
                }

                const typeId = element.dataset.typeId;

                // optional
                const progressBarId = element.dataset.progressbarId ?? null;
                const displayEndpoint = additionalConfig[id]?.endpoint_display ?? null;
                const displayId = element.dataset.displayId || null;
                const deleteEndpoint = additionalConfig[id]?.endpoint_delete ?? null;
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

                // if delete endpoint found
                if (deleteEndpoint)
                {
                    bootstrapConfig.delete_file[id] = new DeleteFile(deleteEndpoint, {notifier, modal});
                }
            });

            if (Object.keys(config).length > 0) {
                new UploadFile(config, endpoint_type, {uploader, notifier});
            }

        });

        /**
         * Performs a delete operation on the specified file.
         *
         * @param {string} id - The identifier of the delete_file object.
         * @param {string} guid - The file GUID to delete.
         *
         * @return {void} - No return value.
         */
        global.VDMDeleteFile = function(id, guid) {
            const deleteInstance = global.VDM.bootstrap?.delete_file?.[id] ?? global.VDM.standalone?.delete_file?.[id];

            if (!deleteInstance || !(deleteInstance instanceof DeleteFile)) {
                console.error(`Error: delete_file with id ${id} is either not defined or not an instance of DeleteFile.`);
            }

            deleteInstance.delete(guid);
        };

        /**
         * Performs a delete operation on the specified set of files.
         *
         * @param {string} id - The identifier of the delete_file object.
         * @param {string[]} guids - Array of file GUIDs to delete.
         *
         * @return {void}
         */
        global.VDMDeleteFiles = function(id, guids) {
            const deleteInstance = global.VDM.bootstrap?.delete_file?.[id] ?? global.VDM.standalone?.delete_file?.[id];

            if (!Array.isArray(guids) || guids.length === 0) {
                console.error('No GUIDs provided for deletion.');
                return;
            }

            if (!deleteInstance || !(deleteInstance instanceof DeleteFile)) {
                console.error(`Error: delete_file with id ${id} is either not defined or not an instance of DeleteFile.`);
                return;
            }

            // Dispatch before batch delete
            document.dispatchEvent(new CustomEvent('vdm.bootstrap.delete.beforeFilesDelete', { guids: guids }));

            const [first, ...rest] = guids;
            const allGuids = [...guids];
            const deletedGuids = new Set();

            const afterDeleteHandler = (event) => {
                const guid = event.detail?.guid;

                if (!guid || !allGuids.includes(guid)) {
                    return;
                }

                deletedGuids.add(guid);

                // When the first file is confirmed deleted, delete the rest (without confirmation)
                if (guid === first) {
                    rest.forEach(g => deleteInstance.delete(g, false));
                }

                // All deletions done
                if (deletedGuids.size === allGuids.length) {
                    document.removeEventListener('vdm.bootstrap.delete.afterFileDelete', afterDeleteHandler);
                    document.dispatchEvent(new CustomEvent('vdm.bootstrap.delete.afterFilesDelete', { guids: allGuids }));
                }
            };

            // Attach the after delete listener
            document.addEventListener('vdm.bootstrap.delete.afterFileDelete', afterDeleteHandler);

            document.dispatchEvent(new CustomEvent('vdm.bootstrap.delete.beforeFirstFileDelete', { guid: first }));

            // Initiate the first deletion (with confirmation)
            deleteInstance.delete(first);
        };

        function resolveUploader(globalScope) {
            const providedUploader = globalScope.Octofilo ?? globalScope.octofilo ?? null;

            if (!providedUploader) {
                return null;
            }

            if (typeof providedUploader === 'function') {
                try {
                    return new providedUploader();
                } catch (error) {
                    console.error('Failed to initialise Octofilo uploader.', error);
                    return null;
                }
            }

            if (typeof providedUploader.upload === 'function') {
                return providedUploader;
            }

            console.error('Octofilo uploader does not expose an upload method.');
            return null;
        }

    })(window);

})();
