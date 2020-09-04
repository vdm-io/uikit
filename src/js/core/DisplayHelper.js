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
export class DisplayHelper {
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
                if (process.env.DEBUG === 'true') {
                    console.error('Error fetching display data:', response);
                }
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
            // If an error occurs, log it in debug mode
            if (process.env.DEBUG === 'true') {
                console.error('Error fetching display data:', error);
            }

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
