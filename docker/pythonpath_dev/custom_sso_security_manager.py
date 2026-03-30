import logging
from superset.security import SupersetSecurityManager


class CustomSsoSecurityManager(SupersetSecurityManager):
    def oauth_user_info(self, provider, response=None):
        logging.info("Oauth2 provider: {0}.".format(provider))
        if provider == "google":
            me = self.appbuilder.sm.oauth_remotes[provider].get("userinfo").json()
            logging.info("user_data: {0}".format(me))
            return {
                "name": me["name"],
                "email": me["email"],
                "id": me["id"],
                "username": me["email"],
                "first_name": me["given_name"],
                "last_name": me["family_name"],
            }
