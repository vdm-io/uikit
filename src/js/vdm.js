import { UploadFile } from './core/upload-file';
import { DeleteFile } from './core/delete-file';
import { OctoMeso } from './ui/octomeso.js';
import { OctoMoe } from './ui/octomoe.js';
import { Octofilo } from './ui/octofilo.js';

(function(global) {
    if (!global.Octofilo) {
        global.Octofilo = Octofilo;
    }

    document.addEventListener('DOMContentLoaded', function() {
        if (!global.VDM) {
            if (process.env.DEBUG) console.error('VDM is not defined, exiting initialization.');
            return;
        }

        const bootstrapConfig = global.VDM.bootstrap || global.VDM.standalone || {};
        const { endpoint_type, target_class, ...additionalConfig } = bootstrapConfig.config || {};

        if (!endpoint_type) {
            if (process.env.DEBUG) console.error('File Type Endpoint is not defined, exiting initialization.');
            return;
        }

        if (!target_class) {
            if (process.env.DEBUG) console.error('The target class is not defined, exiting initialization.');
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
                if (process.env.DEBUG) console.error(`Upload Endpoint for ${id} is not defined, exiting initialization for this field.`);
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
            if (process.env.DEBUG) console.error(`Error: delete_file with id ${id} is either not defined or not an instance of DeleteFile.`);
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
            if (process.env.DEBUG) console.error('No GUIDs provided for deletion.');
            return;
        }

        if (!deleteInstance || !(deleteInstance instanceof DeleteFile)) {
            if (process.env.DEBUG) console.error(`Error: delete_file with id ${id} is either not defined or not an instance of DeleteFile.`);
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
                if (process.env.DEBUG) console.error('Failed to initialise Octofilo uploader.', error);
                return null;
            }
        }

        if (typeof providedUploader.upload === 'function') {
            return providedUploader;
        }

        if (process.env.DEBUG) console.error('Octofilo uploader does not expose an upload method.');
        return null;
    }

})(window);