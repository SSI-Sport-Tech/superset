# Custom login implementation (SSO + admin username/password)

## What it does

- `/login/` shows one page with the SSO buttons (Google, Microsoft Entra ID) and a
  username/password form.
- Username/password login is **admin only**. Any other user is rejected and must use SSO.
- The page follows the app theme (light, dark, system) using the same
  `superset-theme-mode` localStorage key as the Superset UI.

## Files

| File | Role |
| --- | --- |
| `docker/pythonpath_dev/custom_sso_security_manager.py` | Security manager, login view, admin-only check |
| `docker/pythonpath_dev/templates/custom_login.html` | Login page (extends FAB `appbuilder/base.html`) |
| `docker/pythonpath_dev/superset_config.py` | `AUTH_TYPE`, `OAUTH_PROVIDERS`, `CUSTOM_SECURITY_MANAGER` |

## How it works

1. `AUTH_TYPE = AUTH_OAUTH` and `CUSTOM_SECURITY_MANAGER = CustomSsoSecurityManager`.
2. `CustomAuthOAuthView` handles `GET/POST /login/` and `GET /login/<provider>`.
   POST validates the DB form and calls `auth_user_db`; a provider name starts the
   OAuth redirect. Callbacks arrive at `/oauth-authorized/<provider>`.
3. Superset's React login view is registered at `/login/` by default and would shadow
   ours. `register_views` swaps it for `CustomAuthOAuthView` while the views register.
   `register_superset_auth_view = False` does the same on Superset versions that
   support the flag.
4. `authoauthview()` returns the already registered view. Flask-AppBuilder would
   otherwise create a second, unregistered instance with no blueprint, and the rate
   limiter fails at startup with `'NoneType' object has no attribute '__module__'`.
5. `auth_user_db` calls the default check, then returns the user only if they hold
   `AUTH_ROLE_ADMIN` (`Admin` by default).
6. `oauth_user_info` maps Google's userinfo; other providers (Azure) use Flask-AppBuilder's
   built-in handling of the id_token. For Azure the username is set to the email
   instead of the object id.
7. `auth_user_oauth` denies any SSO login whose username is not already a Superset user,
   in addition to `AUTH_USER_REGISTRATION = False`. SSO never creates users.

## Configuration

Set in `docker/.env-local` (or your environment):

```
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
AZURE_OAUTH_CLIENT_ID=
AZURE_OAUTH_CLIENT_SECRET=
AZURE_OAUTH_TENANT_ID=
```

Redirect URIs to register with each provider:

- `https://<host>/oauth-authorized/google`
- `https://<host>/oauth-authorized/azure`

Provider icons use Font Awesome 6 brand classes, for example `fa-brands fa-google`.
Users are never created by SSO. Add each user in Superset first (Settings > List Users,
or `superset fab create-user`) with the **email address as the username**, since that is
what Google and Azure logins are matched on, and assign their role there.

## Adding a provider

Add an entry to `OAUTH_PROVIDERS` with `name`, `icon` and `remote_app`. The button
appears on the login page automatically. If the provider's userinfo is not handled by
Flask-AppBuilder, add a branch in `oauth_user_info`.

## Troubleshooting

List the registered login routes (run from the repo root, container name from
`docker ps`):

```bash
docker exec superset_app python -c "
from superset.app import create_app
app = create_app()
with app.app_context():
    for r in app.url_map.iter_rules():
        if r.rule.startswith('/login') or 'oauth-authorized' in r.rule:
            print(r.rule, r.endpoint)
" 2>&1 | grep -E '^/|Error|Traceback'
```

Expected output, with only our view owning each path:

```
/login/<provider> CustomAuthOAuthView.login
/login/ CustomAuthOAuthView.login
/oauth-authorized/<provider> CustomAuthOAuthView.oauth_authorized
```

A `SupersetAuthView.login` line means Superset's React view is still registered.

- **React login page, no form:** the override is not applied. Run the command above and
  check that only `CustomAuthOAuthView.login` owns `/login/`.
- **Startup error `'NoneType' object has no attribute '__module__'`:** `authoauthview()`
  is not returning the registered view.
- **Login page redirects in a loop to `/`:** the login routes must be `/login/` and
  `/login/<provider>` because FAB's `AuthView` has an empty `route_base`.
- **`Failed to add user to db session ... LocalProxy`:** harmless warning from event
  logging for a not-yet-logged-in user.
- **Changes ignored:** the container may run the Superset code baked into its image, so
  restart `superset_app` after editing anything under `docker/pythonpath_dev/`.

## Keeping this through upstream syncs

New files here (`CUSTOM_AUTH.md`, `custom_sso_security_manager.py`,
`templates/custom_login.html`) cannot conflict with upstream. Two upstream files are
edited and can conflict on merge; re-apply our changes if they do:

- `docker/pythonpath_dev/superset_config.py` (the OAuth block at the end)
- `docker/pythonpath_dev/.gitignore` (the two whitelist lines)
