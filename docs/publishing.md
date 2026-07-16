# Publishing

This package is a public npm package named `@dreki-gg/pi-mcp`. The repository is `jalbarrang/pi-mcp`; keep the `repository` field in `package.json` aligned with it because npm trusted publishing validates that exact URL.

## One-time setup

1. Verify the release candidate locally:

   ```sh
   pnpm test
   pnpm pack:check
   ```

2. Publish version `0.1.0` manually. This creates the npm package, which is required before its trusted publisher can be configured:

   ```sh
   npm publish --access public
   ```

   npm will request an OTP if the account requires two-factor authentication. Do not reuse a version after any publish attempt succeeds; npm package versions are immutable.

3. Create the matching GitHub release baseline so Release Please starts from the published version:

   ```sh
   git push origin main
   gh release create v0.1.0 --target main --title v0.1.0 --generate-notes
   ```

4. In npm package settings, configure a GitHub Actions trusted publisher with these exact values:

   | Field | Value |
   | --- | --- |
   | Organization or user | `jalbarrang` |
   | Repository | `pi-mcp` |
   | Workflow filename | `release-please.yml` |
   | Allowed action | `npm publish` |

5. After the first automated release succeeds, set npm publishing access to "Require two-factor authentication and disallow tokens." The workflow uses GitHub OIDC instead of a stored npm token.

## Subsequent releases

1. Use Conventional Commit prefixes: `fix:` releases a patch and `feat:` releases a minor version while the project is pre-1.0.
2. Push commits to `main`. `.github/workflows/release-please.yml` opens or updates a release PR from `release-please-config.json`.
3. Merge the release PR. The same workflow installs the locked dependencies, runs the `prepublishOnly` verification, and publishes through npm trusted publishing. Public packages from public repositories automatically receive npm provenance.

## Sources

- [npm package.json fields](https://docs.npmjs.com/cli/v12/configuring-npm/package-json)
- [npm publish](https://docs.npmjs.com/cli/v12/commands/npm-publish)
- [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/)
- [Release Please action](https://github.com/googleapis/release-please-action)
