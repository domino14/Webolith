from django.apps import AppConfig


class WordwallsAppConfig(AppConfig):
    name = 'wordwalls'

    def ready(self):
        # Set up the receivers.
        import wordwalls.signal_handlers   # noqa
