# Project and receipt formats

The editable format is `patchstage-project-v1`. The root has exactly `schema`, `title`, `notes`, `stations` and `inputs`. Unknown fields reject the import so unsupported content is not silently discarded.

Stations have exactly `id`, `label`, `x` (0–4, page left to right) and `y` (0–2, upstage to downstage). IDs are strings s1–s999999 and unique. Labels can repeat; references use IDs.

Inputs have exactly `id`, `channel`, `label`, `station`, `device`, `stand`, `provider`, `notes`. IDs are i1–i999999 and unique. Channel is null or integer 1–64. Station is null or an existing station ID. Provider is `unspecified`, `act` or `venue` and applies to the mic / DI. Inputs are separate mono planning rows; channels may repeat and trigger an audit note.

Null assignments, missing device/provider details, shared cells and empty stations are permitted planning states, not import errors. No export drops them. Station deletion cannot orphan an input.

Single-line fields reject line breaks. Text rejects unsafe control characters and unpaired UTF-16 surrogates. Show notes accept line breaks. Limits are documented in the README.

A `patchstage-receipt-v1` file contains the entire editable project, summary/diagnostics, and a derived patch array. It is an audit export, not an import format. Reopen the project JSON instead. SVG/HTML are presentation exports, not round-trip formats.

Reading a local file is asynchronous. A newer file selection or any draft/saved change invalidates an older in-flight read. Invalid input preserves the current project. Successful loads enter the undo history.

The model contains no paths, external resources, embedded scripts, executable configuration or hidden account state.
