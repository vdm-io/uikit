const MULTIPLE_NAME_SUFFIX = '[]';

/**
 * Lightweight file uploader that mimics the UIkit upload API while using
 * vanilla XMLHttpRequest calls under the hood. Designed to integrate with the
 * existing UploadFile controller without any external dependency.
 */
export class Octofilo {
    /**
     * Attach upload behaviour to the provided selector.
     *
     * @param {string|HTMLElement|NodeList|HTMLElement[]} selector
     * @param {object} options
     */
    upload(selector, options = {}) {
        const targets = this.#resolveElements(selector);

        if (!targets.length) {
            if (process.env.DEBUG) {
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
                    if (process.env.DEBUG) {
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
