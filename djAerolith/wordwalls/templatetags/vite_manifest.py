"""
Template tags for reading Vite manifest.json to get hashed asset filenames.
"""

import json
import os
from django import template
from django.conf import settings
from django.core.cache import cache

register = template.Library()


@register.simple_tag
def vite_asset(entry_name: str) -> str:
    """
    Get the hashed filename for a Vite asset from manifest.json

    Args:
        entry_name: The original entry name (e.g., 'index.ts')

    Returns:
        The hashed filename from the manifest (e.g., 'wordwallsapp.abc123.js')
    """
    # Cache the manifest to avoid reading it on every request
    cache_key = "vite_manifest"
    manifest = cache.get(cache_key)

    if manifest is None:
        manifest_path = os.path.join(
            settings.BASE_DIR, "static/dist/.vite/manifest.json"
        )

        try:
            with open(manifest_path, "r") as f:
                manifest = json.load(f)
                # Cache for 5 minutes in development, longer in production
                cache_timeout = 300 if settings.DEBUG else 1800
                cache.set(cache_key, manifest, cache_timeout)
        except (FileNotFoundError, json.JSONDecodeError):
            # Fallback to default names if manifest doesn't exist
            manifest = {}

    # Look up the entry in the manifest
    if entry_name in manifest:
        return manifest[entry_name]["file"]

    # Fallback for development or if manifest entry not found
    if entry_name == "index.ts":
        return "wordwallsapp.js"
    elif entry_name.endswith(".css"):
        return "wordwallsapp.css"

    return entry_name


@register.simple_tag
def vite_css_asset(entry_name: str) -> str:
    """
    Get the CSS asset associated with a Vite entry

    Args:
        entry_name: The original entry name (e.g., 'index.ts')

    Returns:
        The hashed CSS filename from the manifest (e.g., 'wordwallsapp.abc123.css')
    """
    cache_key = "vite_manifest"
    manifest = cache.get(cache_key)

    if manifest is None:
        manifest_path = os.path.join(
            settings.BASE_DIR, "static/dist/.vite/manifest.json"
        )

        try:
            with open(manifest_path, "r") as f:
                manifest = json.load(f)
                cache_timeout = 300 if settings.DEBUG else 3600
                cache.set(cache_key, manifest, cache_timeout)
        except (FileNotFoundError, json.JSONDecodeError):
            manifest = {}

    # Look for CSS assets associated with the entry
    if entry_name in manifest and "css" in manifest[entry_name]:
        css_files = manifest[entry_name]["css"]
        if css_files:
            return css_files[0]  # Return the first CSS file

    # Fallback
    return "wordwallsapp.css"
