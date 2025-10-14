const DEFAULT_TITLE = 'Please Confirm';
const DEFAULT_CONFIRM = 'Confirm';
const DEFAULT_CANCEL = 'Cancel';

/**
 * Bootstrap driven modal helper that falls back to the browser confirm dialog
 * when Bootstrap is unavailable.
 */
export class OctoMoe {
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
