# Repository Guidelines

## Project Structure & Module Organization

`loop-and-bell.html` contains the standalone application, styles, exercise data, and embedded WebP illustrations, with additional image references under `assets/exercises/` (see README for source availability). `index.html` is the GitHub Pages entry point. `tests/loop-and-bell.test.cjs` tests the actual inline script using Node's built-in test runner. `.github/workflows/check.yml` runs those tests. No dependency manifests or build step are needed. Keep the standalone layout until a deliberate restructuring is requested.

The existing `.agents/`, `.codex/`, `.aws/`, and `.git/` directories are reserved environment directories. Do not use them for application files or modify them as part of routine contributions.

## Build, Test, and Development Commands

Run `node --test tests/loop-and-bell.test.cjs` with Node.js 20 or newer. Serve locally with `python -m http.server 8000`. See `README.md` for publishing and verification. There are no dependencies to install and no production build. If introducing a toolchain, document its commands and commit its manifest and lockfile together.

## Coding Style & Naming Conventions

Follow the conventions of the language and framework selected for the implementation. Use consistent indentation within each file, descriptive identifiers, and filenames that reflect module responsibilities. Add a formatter and linter configuration when establishing the toolchain, and document their commands. Avoid unrelated formatting changes in functional patches.

## Testing Guidelines

Use Node's built-in test runner for behavior changes, including important failure cases. There is no coverage threshold. The lightweight DOM harness does not validate browser layout, audio, or actual wake lock behavior; verify those in a browser. Use descriptive test names and document new verification commands.

## Commit & Pull Request Guidelines

Git history is unavailable in this workspace, so existing commit conventions cannot be verified. Use concise, imperative commit subjects, such as `Add workout validation`, and keep commits focused.

Pull requests should describe the problem, implementation, and validation performed. Link relevant issues, include screenshots for visible interface changes, and explicitly identify setup changes or checks that could not be run.

## Security & Configuration

Keep credentials and private configuration out of source control. Provide placeholder values in an example configuration file when configuration is introduced, and document required environment variables.
