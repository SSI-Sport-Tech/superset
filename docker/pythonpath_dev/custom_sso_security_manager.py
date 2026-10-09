import logging
import os
from typing import Optional

import jwt
from flask import flash, g, redirect, request, session, url_for
from flask_appbuilder._compat import as_unicode
from flask_appbuilder.security.decorators import no_cache
from flask_appbuilder.security.forms import LoginForm_db
from flask_appbuilder.security.utils import generate_random_string
from flask_appbuilder.security.views import AuthOAuthView
from flask_appbuilder.utils.base import get_safe_redirect
from flask_appbuilder.views import expose
from flask_login import login_user
from werkzeug.wrappers import Response as WerkzeugResponse

from superset.security import SupersetSecurityManager

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")


class CustomAuthOAuthView(AuthOAuthView):
    login_template = "custom_login.html"

    # FAB's AuthView has an empty route_base, so full paths are required.
    @expose("/login/", methods=["GET", "POST"])
    @expose("/login/<provider>")
    @no_cache
    def login(self, provider: Optional[str] = None) -> WerkzeugResponse:
        if g.user is not None and g.user.is_authenticated:
            return redirect(self.appbuilder.get_url_for_index)

        form = LoginForm_db()
        if form.validate_on_submit():
            next_url = get_safe_redirect(request.args.get("next", ""))
            user = self.appbuilder.sm.auth_user_db(
                form.username.data, form.password.data
            )
            if not user:
                flash(as_unicode(self.invalid_login_message), "warning")
                return redirect(self.appbuilder.get_url_for_login_with(next_url))
            login_user(user, remember=False)
            return redirect(next_url)

        if provider is None:
            return self.render_template(
                self.login_template,
                providers=self.appbuilder.sm.oauth_providers,
                form=form,
                title=self.title,
                appbuilder=self.appbuilder,
            )

        random_state = generate_random_string()
        state = jwt.encode(
            request.args.to_dict(flat=False), random_state, algorithm="HS256"
        )
        session["oauth_state"] = random_state
        try:
            return self.appbuilder.sm.oauth_remotes[provider].authorize_redirect(
                redirect_uri=url_for(
                    ".oauth_authorized", provider=provider, _external=True
                ),
                state=state.decode("ascii") if isinstance(state, bytes) else state,
            )
        except Exception:
            logging.exception("OAuth redirect failed for provider %s", provider)
            flash(as_unicode(self.invalid_login_message), "warning")
            return redirect(self.appbuilder.get_url_for_index)


class CustomSsoSecurityManager(SupersetSecurityManager):
    # Newer Superset honours this flag; older images ignore it (see register_views).
    register_superset_auth_view = False

    def authoauthview(self):
        # FAB calls this as a factory; reuse the registered view so its blueprint exists.
        return self.auth_view or CustomAuthOAuthView()

    def __init__(self, appbuilder):
        super().__init__(appbuilder)
        appbuilder.app.jinja_loader.searchpath.append(TEMPLATE_DIR)

    def register_views(self) -> None:
        # Older Superset hardcodes SupersetAuthView at /login/, which would shadow ours.
        from superset.views import auth as superset_auth_views

        original = superset_auth_views.SupersetAuthView
        superset_auth_views.SupersetAuthView = CustomAuthOAuthView
        try:
            super().register_views()
        finally:
            superset_auth_views.SupersetAuthView = original

    def auth_user_db(self, username, password):
        user = super().auth_user_db(username, password)
        if user is None:
            return None

        admin_role = self.appbuilder.app.config["AUTH_ROLE_ADMIN"]
        if any(role.name == admin_role for role in user.roles):
            return user

        logging.warning(
            "Database login denied for non-admin user '%s'; SSO is required",
            username,
        )
        return None

    def oauth_user_info(self, provider, response=None):
        logging.info("Oauth2 provider: {0}.".format(provider))
        if provider == "google":
            me = self.appbuilder.sm.oauth_remotes[provider].get("userinfo").json()
            logging.info("Google login attempt for %r", me.get("email"))
            return {
                "name": me["name"],
                "email": me["email"],
                "id": me["id"],
                "username": me["email"],
                "first_name": me.get("given_name", me["name"]),
                "last_name": me.get("family_name", ""),
            }
        # FAB's oauth_user_info is a None placeholder; the default handler is get_oauth_user_info.
        info = super().get_oauth_user_info(provider, response)
        if provider == "azure" and info and info.get("email"):
            # FAB defaults the Azure username to the opaque object id.
            info["username"] = info["email"]
            logging.info("Azure login attempt for %r", info["username"])
        return info

    def auth_user_oauth(self, userinfo):
        # Never auto-create users; they must be added in Superset first.
        username = userinfo.get("username") or userinfo.get("email")
        if not username or not self.find_user(username=username):
            logging.warning("OAuth login denied for unregistered user '%s'", username)
            return None
        return super().auth_user_oauth(userinfo)
