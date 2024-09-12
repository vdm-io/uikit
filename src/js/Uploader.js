import { UikitUploader } from './core/UikitUploader';

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
            if (process.env.DEBUG) console.error('Endpoint is not defined, exiting initialization.');
            return;
        }

        if (!targetClass) {
            if (process.env.DEBUG) console.error('The target class is not defined, exiting initialization.');
            return;
        }

        const uploadElements = document.querySelectorAll('.' + targetClass);
        const config = {};

        uploadElements.forEach(element => {
            const id = element.getAttribute('id');
            const uploadEndpoint = global.vdmUploaderConfig[id] ? global.vdmUploaderConfig[id].endpoint : null;

            if (!uploadEndpoint) {
                if (process.env.DEBUG) console.error(`Upload Endpoint for ${id} is not defined, exiting initialization for this field.`);
                return; // Skip this field if no upload endpoint is found
            }

            const progressBarId = element.dataset.progressbarId;
            const typeId = element.dataset.typeId;
            // optional
            const displayEndpoint = global.vdmUploaderConfig[id] ? global.vdmUploaderConfig[id].endpoint_display : null;
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
