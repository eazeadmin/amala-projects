# AMALA Projects

AMALA Agency's project management app, live at https://projects.amala.agency.

It runs [Plane](https://github.com/makeplane/plane) Community Edition with AMALA branding and an AMALA project template added at build time. Plane's source code isn't modified.

## Files

| File | What it does |
|---|---|
| `Dockerfile` | Starts from Plane's official `makeplane/plane-aio-community:stable` image and runs `apply_branding.py`. |
| `apply_branding.py` | Finds Plane's built files, swaps in the icons, rewrites page titles and descriptions, renames the app in email templates, and adds `brand.css` and `brand.js` to each page. |
| `brand.css` | Hides Plane's logo and customer-logo strip and shows an AMALA wordmark. |
| `brand.js` | Changes "Plane" to "AMALA Projects" in the interface, and contains the project template (below). |
| `template.js` | The project template on its own, for reading and editing. Its contents are copied to the end of `brand.js`, which is what ships. |
| `*.png`, `*.ico`, `*.gif` | AMALA icons, social image and loading spinner. |

If a Plane update moves its files, the build fails with an error rather than shipping half-branded.

## Project template (EOS layout)

Every project's **Settings** page has an **Apply AMALA template** button in the bottom-right corner. Click it twice: the first click asks you to confirm, the second applies the template. It adds:

- **Statuses:** Not Started (the default), In Progress, Blocked, Ongoing, Completed.
- **Department labels:** Marketing, Sales, Distribution, Finance, Processing and Operations, under a "Department" group.
- **Pages:** Overview (Vision, Mission, Outcome, key links, how the project works), Weekly Scorecard, and SOPs & Assets.
- **A first Rock:** a module for the current quarter, due at quarter end. It's only added if the project has no Rocks yet.
- **Modules, Cycles and Pages** switched on for the project.

The template only adds what's missing, so clicking it on a project that already has it changes nothing. It runs as the signed-in user, so no API keys are needed. Only project admins can apply it.

Mapping from the EOS sheet:

- **Rocks** become Modules, and progress % is calculated automatically.
- Module status **In Progress** means On Track; **Paused** means Needs Attention or Blocked.
- **Priority 1 / 2 / 3** become High / Medium / Low.
- **Owner** becomes the assignee.

To change the template, edit `template.js`, copy its contents to the end of `brand.js` (replacing everything after the "AMALA project template" marker line), and push.

## Deploy

Railway builds this repo on every push to `main`. The Plane service in the `gian-automation-journey` project gets its Postgres, Redis, RabbitMQ and storage-bucket settings from Railway variables. If a push doesn't start a build, check that Railway's GitHub app has access to this repo.

## Update Plane

Redeploy the service in Railway. The build pulls the latest `stable` image and reapplies everything.

## License

Plane is licensed under AGPL-3.0, and this layer is too. Anyone using the app over the network is entitled to its source code. This repo, together with Plane's upstream source at https://github.com/makeplane/plane, meets that requirement.
