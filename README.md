# AMALA Projects

AMALA Agency's project management app, live at https://projects.amala.agency.

It runs [Plane](https://github.com/makeplane/plane) Community Edition with AMALA branding added at build time. Plane's source code isn't modified. A small layer replaces the icons and rebrands the interface.

## How it works

- `Dockerfile` starts from Plane's official `makeplane/plane-aio-community:stable` image and runs the branding script.
- `brand/apply_branding.py` finds Plane's built files, swaps in the icons from `brand/assets/`, rewrites page titles and descriptions, renames the app in email templates, and adds `brand.css` and `brand.js` to each page.
- `brand/brand.css` hides Plane's logo and the customer-logo strip, and shows an AMALA wordmark.
- `brand/brand.js` changes "Plane" to "AMALA Projects" in interface text and the browser tab title.

If a Plane update moves its files, the build fails with an error rather than shipping half-branded.

## Deploy

Railway builds this repo automatically on every push to `main`. The Plane service in the `gian-automation-journey` project gets its Postgres, Redis, RabbitMQ and storage-bucket settings from Railway variables.

## Update Plane

Redeploy the service in Railway. The build pulls the latest `stable` image and reapplies the branding.

## Change the branding

- Logo and icons: replace the files in `brand/assets/` and keep the same file names.
- Wordmark text and font: edit `brand/brand.css`.
- App name: change `NAME` in both `brand/brand.js` and `brand/apply_branding.py`.

## License

Plane is licensed under AGPL-3.0, and the branding layer is too. Anyone using this app over the network is entitled to its source code. This repo, together with Plane's upstream source at https://github.com/makeplane/plane, meets that requirement.
