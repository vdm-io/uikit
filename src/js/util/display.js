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
export class Display {
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
                if (process.env.DEBUG) {
                    console.error('Error fetching display data:', response);
                }
                return;
            }

            const result = await response.json();

            // Check if result contains an error
            if (result.error) {
                // Log the error in debug mode and show a user-friendly message
                if (process.env.DEBUG) {
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
            if (process.env.DEBUG) {
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
        document.dispatchEvent(new CustomEvent(`vdm.uikit.display.${eventName}`, {detail}));
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
