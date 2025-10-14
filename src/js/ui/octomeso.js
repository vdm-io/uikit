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
export class OctoMeso {
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
