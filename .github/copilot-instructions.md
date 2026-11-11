# Repository Instructions

- Use Yarn for dependency changes and project scripts.
- When resolving a missing webpack plugin, check the project's current Angular builder and webpack dependency tree before installing a version; do not blindly add the latest release. Use `yarn why <package>` and keep plugin versions compatible with the webpack instance used by the Angular builder, especially for ModuleFederationPlugin.
