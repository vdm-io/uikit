# VDM Bootstrap File Integration Guide

## Overview

VDM Bootstrap bundles the logic required to provide a Bootstrap 5.3 compliant upload workflow, complete with Joomla-flavoured notifications and confirmation modals. The library listens for configuration from the global `VDM` namespace, attaches the bundled Octofilo uploader to the configured drop zones, and relies on Bootstrap (as shipped with Joomla 5) to present contextual alerts and modals.

## Requirements

- Bootstrap 5.3 CSS utilities must be available on the page (ships with Joomla 5).
- The global `VDM` namespace needs to expose the `bootstrap` configuration block (a legacy `standalone` block is still honoured).
- Optionally provide a global `Octofilo` implementation if you want to override the bundled uploader.

## Usage

1. **Include Dependencies**

   ```html
   <link href="/media/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
   <script src="/media/vendor/vdm-bootstrap/vdm.min.js" type="module"></script>
   ```

2. **Markup the Upload Area**

   ```html
   <select id="type-field-id" class="form-select" aria-label="Select">
       <option value="guid-value-1">Option 01</option>
       <option value="guid-value-2">Option 02</option>
   </select>

   <div id="upload_id" class="vdm-drop-zone border border-dashed rounded-3 p-5 text-center bg-light"
        data-type-id="type-field-id"
        data-progressbar-id="progressbar-id"
        data-display-id="display-id"
        data-success-id="success-id"
        data-error-id="error-id"
        data-allowed-format-id="allowed-format-id"
        data-file-type-id="file-type-id"
        hidden>
       <span class="d-block fw-semibold mb-2">Drop files here or click to browse</span>
       <small class="text-muted">Allowed: <span id="allowed-format-id"></span></small>
   </div>

   <div class="progress mt-3" hidden id="progressbar-id">
       <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
   </div>

   <div id="success-id" class="mt-3" hidden></div>
   <div id="error-id" class="mt-3" hidden></div>
   <div id="display-id" class="mt-3" hidden></div>
   ```

3. **Configure VDM Bootstrap**

   ```html
   <script>
   window.VDM = window.VDM || {};
window.VDM.bootstrap = {
       config: {
           endpoint_type: 'https://your-type-endpoint.com',
           target_class: 'vdm-drop-zone',
           upload_id: {
               endpoint_upload: 'https://your-upload-endpoint.com',
               endpoint_display: 'https://your-display-endpoint.com',
               endpoint_delete: 'https://your-delete-endpoint.com'
           }
       }
   };
   </script>
   ```

Once the DOM is ready, VDM Bootstrap will:

   - Request file type metadata using the configured `endpoint_type`.
   - Attach Octofilo to each element with the class defined in `target_class` (falling back to the bundled uploader when no global instance is present).
   - Present progress, notifications, and modals using Bootstrap styled components and Joomla's message renderer when available.

## Bootstrap Based UI Helpers

- **OctoMeso** – produces dismissible alerts that integrate with `Joomla.renderMessages` when available and gracefully fall back to stacked Bootstrap alerts.
- **OctoMoe** – renders confirmation modals using `bootstrap.Modal` with a browser `confirm` fallback for environments where Bootstrap is not initialised.
- **Octofilo** – a small XMLHttpRequest based uploader that emulates the historic UIkit upload API while playing nicely with Bootstrap drop zones.

Both helpers are bundled with VDM Bootstrap, ensuring consistent presentation without requiring UIKit.

## License

Copyright [Llewellyn van der Merwe](https://git.vdm.dev/Llewellyn) under the [MIT license](LICENSE.md).
