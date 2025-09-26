from django.apps import AppConfig


class FootballTimeNsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'football_time_ns'
    def ready(self):
        import football_time_ns.signals