"""
Send Socket command

"""

import logging
import json

from channels import Group
from django.core.management.base import BaseCommand, CommandError

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = """ Send a command. if contents are provided, must be in JSON """

    def add_arguments(self, parser):
        parser.add_argument("command", type=str)
        parser.add_argument("channel", type=str)
        parser.add_argument("--contents", type=str)

    def handle(self, *args, **options):
        if "command" not in options or "channel" not in options:
            raise CommandError("Required args: command channel")
        try:
            contents_obj = json.loads(options["contents"])
        except (TypeError, ValueError):
            contents_obj = {}
        Group(options["channel"]).send(
            {"text": json.dumps({"type": options["command"], "contents": contents_obj})}
        )
