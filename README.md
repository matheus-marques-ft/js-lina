# Lina

Lina is JumpServer's frontend UI project, built primarily with [Vue](https://vuejs.org/) and [Element UI](https://element.eleme.io/).
The name comes from the Dota hero [Lina](https://dota2.fandom.com/wiki/Lina).

## Development

```
0. Prerequisite: have a running JumpServer API server
   Node.js 24.x, yarn 4.x

1. Install dependencies
$ corepack enable
$ yarn install

2. Edit `VITE_CORE_HOST` in `.env.development`
# ...
VITE_CORE_HOST = 'JUMPSERVER_APIHOST'

3. Run
$ yarn serve

4. Build
$ yarn build:prod
```

## Production deployment

Download the RELEASE file, place it in the appropriate directory, and set up the nginx config file as follows:
```
server {
  listen 80;

  location /ui/ {
    try_files $uri / /ui/index.html;
    alias /opt/lina/;
  }

  location / {
    rewrite ^/(.*)$ /ui/$1 last;
  }
}
```

## Acknowledgments
- [Vue](https://vuejs.org) - frontend framework
- [Element UI](https://element.eleme.io/) - UI component library
- [Vue-element-admin](https://github.com/PanJiaChen/vue-element-admin) - project scaffold


## License & Copyright
Be consistent with [jumpserver](https://github.com/jumpserver/jumpserver)

## Repository Layout

This repo builds the admin-console frontend consumed by [js-docker-web](https://github.com/matheus-marques-ft/js-docker-web) (which bundles it together with [js-luna](https://github.com/matheus-marques-ft/js-luna) into the `web` image published by [js-installer](https://github.com/matheus-marques-ft/js-installer)).

- **`src/main.js`** — app bootstrap: Vuex `store`, `router`, `vue-i18n`, Element Plus, global directives, and the SVG/Element-Plus icon registration.
- **`src/router/` + `src/guards.js`** — permission-driven routing. `constantRoutes` are always present; the rest (`console`/`pam`/`audit`/`workbench`/`tickets`/`settings`/`profile`/`reports`) are generated from the current user's backend permissions on login.
- **`src/store/modules/`** — Vuex state: `users` (profile, current org, perms), `app` (device/sidebar/org switching), `permission` (generated routes/menu), `settings`, `table`, `tagsView`, `common`, `assets`, `chat`.
- **`src/layout/`** — the single top-level `Layout` (navbar + side menu + `AppMain` router-view host), plus the `Generic*` page orchestrators (`GenericListPage`, `GenericCreateUpdateForm`, `GenericDetailPage`, etc.) that most CRUD views are assembled from.
- **`src/components/Form/{DataForm,AutoDataForm}`** and **`src/components/Table/{ListTable,AutoDataTable,DataTable}`** — the config-driven form/table renderers that back most resource views; custom field widgets live under `Form/FormFields`, cell renderers under `Table/TableFormatters`.
- **`src/views/`** — one directory per resource area (`assets`, `accounts`, `users`, `perms`, `sessions`, `tickets`, `settings`, `reports`, `ops`, `workbench`, ...).
- **`src/i18n/`** — `vue-i18n` setup; locale catalogs live in `src/i18n/langs/*.json` (`en`, `zh`, `zh_hant`, `ja`), with Python scripts (`yarn diff-i18n`/`yarn apply-i18n`) to keep them in sync.
- **`Dockerfile-base`** / **`Dockerfile`** — two-stage build: `Dockerfile-base` installs Node dependencies (published as the `lina-base` image and rebuilt only when `package.json`/`yarn.lock` change); `Dockerfile` builds the app on top of that base and copies the output into an nginx image.

### CI → GHCR mapping

| Workflow | Publishes |
|---|---|
| `build-base-image.yml` | `ghcr.io/matheus-marques-ft/lina-base:<timestamp>` — triggered by `package.json`/`yarn.lock`/`Dockerfile-base` changes on `pr*` branches, then auto-commits the new tag into `Dockerfile` |
| `build-release-image.yml` | `ghcr.io/matheus-marques-ft/lina:<tag>` (and `:latest`) — triggered on `v*` tags |
| `release-drafter.yml` | drafts a GitHub Release with a `lina-<tag>.tar.gz` build artifact — triggered on `v*` tags |
