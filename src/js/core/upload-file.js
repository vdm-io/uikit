import {FileType} from '../util/file-type.js';
import {Display} from '../util/display.js';

/**
 * Class for uploading files.
 *
 * @class
 * @classdesc This class provides methods for uploading files to a server.
 */
export class UploadFile {
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
     * The UIKit variable is a reference to a UI framework for building web applications.
     */
    #uikit;

    /**
     * Creates an instance of the UploadFile class.
     *
     * @param {Object} config - Configuration details for uploader instances.
     * @param {string} endpoint - The endpoint where the files will be uploaded.
     * @param {any} uikit - Reference to UIKit.
     */
    constructor(config, endpoint, uikit) {
        this.#fileType = new FileType(endpoint);
        this.#display = new Display();
        this.#uikit = uikit;

        this.#initializeFields(config);
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

            this.#uikit.upload(`#${id}`, {
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
        this.#uikit.notification({
            message,
            status,
            pos: 'top-center',
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
        if (process.env.DEBUG) {
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
        document.dispatchEvent(new CustomEvent(`vdm.uikit.uploader.${eventName}`, {detail}));
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
