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
export class UploadHelper {
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
            process.env.DEBUG && console.log(`Field ${id} is already initialized, reusing existing data.`);
            return;
        }

        try {
            const url = this.#buildUrl(this.#endpoint, guid);
            const result = await this.#fetchData(url);

            if (process.env.DEBUG) console.log('Data fetched:', result);

            if (result?.data && typeof result.data === 'object') {
                this.set(id, result.data);
            } else if (result?.error) {
                throw new Error(result.error || 'An error occurred during the file type request.');
            }
        } catch (error) {
            if (process.env.DEBUG) console.error('Error during initialization:', error);
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
            process.env.DEBUG && console.error('Error fetching data:', response);
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
