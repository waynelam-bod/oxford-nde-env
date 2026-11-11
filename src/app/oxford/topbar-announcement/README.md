# Topbar announcements

The custom module mounts the announcement element in `nde-header` automatically.
Configure `fulldisplay.constants.general_message` as a JSON-encoded array of objects
with `viewId`, `message`, `from`, and `to` string fields. The view ID must exactly
match the URL's `vid` parameter; dates are ISO 8601 timestamps.

Matching messages are visible from `from` through `to` inclusive, and update at
their scheduled boundaries without a page reload. HTML is sanitized by Angular.
The close button dismisses a message until the component is recreated or the
translation changes. Invalid JSON and invalid entries are reported in the console.

See the topbar announcement section of the [project README](../../../../README.md)
for an example.
