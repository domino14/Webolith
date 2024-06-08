import io
import json
import requests
import traceback

from django.utils.timezone import now
from django.conf import settings


class CaptureMiddleware:
    DEFAULT_EXTERNAL_SERVER_URL = (
        "https://app.codecomet.io/api/trafficconsumer.TrafficService/IngestTrafficLog"
    )
    RFC3339_FMT = "%Y-%m-%dT%H:%M:%S.%fZ"

    def __init__(self, get_response):
        self.get_response = get_response
        self.api_key = settings.CODECOMET_API_KEY
        self.project_id = settings.CODECOMET_PROJECT_ID
        self.capture_all = getattr(settings, "CODECOMET_CAPTURE_ALL", False)
        self.external_server_url = getattr(
            settings, "CODECOMET_EXTERNAL_SERVER_URL", self.DEFAULT_EXTERNAL_SERVER_URL
        )
        if not self.external_server_url:
            self.external_server_url = self.DEFAULT_EXTERNAL_SERVER_URL
        self.static_extensions = {
            ".js",
            ".css",
            ".png",
            ".jpg",
            ".jpeg",
            ".gif",
            ".svg",
            ".ico",
            ".woff2",
        }
        self.app_directory = settings.BASE_DIR

    def __call__(self, request):
        if any(request.path.endswith(ext) for ext in self.static_extensions):
            response = self.get_response(request)
            return response

        request_timestamp = now()
        request.cc_request_data = {}
        request.cc_request_data["request_time"] = request_timestamp.strftime(
            self.RFC3339_FMT
        )
        request.cc_request_data["project_id"] = self.project_id

        response = None

        request.cc_request_data["method"] = request.method
        request.cc_request_data["path"] = request.path
        request.cc_request_data["query_string"] = request.META["QUERY_STRING"]
        request.cc_request_data["request_headers"] = self.get_raw_headers(request)
        request.cc_request_data["raw_request"] = request.body.decode("utf-8")

        # No need to wrap Django middleware in try/except
        # https://docs.djangoproject.com/en/5.0/topics/http/middleware/#exception-handling
        response = self.get_response(request)
        response_body_text = response.content.decode("utf-8")
        response_timestamp = now()
        request.cc_request_data["response_time"] = response_timestamp.strftime(
            self.RFC3339_FMT
        )
        request.cc_request_data["raw_response"] = response_body_text
        request.cc_request_data["status_code"] = response.status_code

        self.send_data_to_external_server(request)
        return response

    def process_exception(self, request, exception):
        request.cc_request_data["status_code"] = 500
        self.handle_exception(request, exception)
        # Allow default exception handling to kick in, return nothing
        self.send_data_to_external_server(request)

    def get_raw_headers(self, request):
        return {key: value for key, value in request.headers.items()}

    def handle_exception(self, request, exception):
        request.cc_request_data["exception_message"] = str(exception)
        string_buffer = io.StringIO()
        traceback.TracebackException.from_exception(exception).print(file=string_buffer)
        request.cc_request_data["traceback"] = string_buffer.getvalue()
        string_buffer.close()

    def send_data_to_external_server(self, request):
        data = request.cc_request_data
        if not self.capture_all and data.get("status_code") < 500:
            return
        try:
            data["executable_path"] = str(self.app_directory)
            wrapper = {"log": data}
            headers = {"Content-Type": "application/json", "Api-Key": self.api_key}
            response = requests.post(
                self.external_server_url, data=json.dumps(wrapper), headers=headers
            )
            if response.status_code != 200:
                print(f"Failed to log data: {response.status_code} - {response.text}")
        except Exception as ex:
            print(f"Error sending data to external server: {ex}")
