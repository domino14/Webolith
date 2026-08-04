"""
Template tags for reading Vite manifest.json to get hashed asset filenames.
"""

import json
import os
from django import template
from django.conf import settings

register = template.Library()


def _load_manifest() -> dict:
    manifest_path = os.path.join(settings.BASE_DIR, "static/dist/.vite/manifest.json")
    try:
        with open(manifest_path, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _collect_css(manifest: dict, chunk_name: str, seen=None) -> list:
    """
    Walk a chunk's static imports depth-first, collecting its CSS files.

    Vite attaches CSS to whichever chunk actually owns it. With a single entry
    that is the entry itself, but as soon as two entries share the same
    stylesheet imports the CSS is hoisted into a shared vendor chunk and a plain
    manifest[entry]["css"] lookup comes back empty. Walking `imports` is what
    Vite's own backend-integration guidance prescribes.

    The chunk's own CSS is collected before its imports', so an entry that does
    own its stylesheet still wins.
    """
    if seen is None:
        seen = set()
    if chunk_name in seen or chunk_name not in manifest:
        return []
    seen.add(chunk_name)
    chunk = manifest[chunk_name]
    css = list(chunk.get("css", []))
    for imported in chunk.get("imports", []):
        css.extend(_collect_css(manifest, imported, seen))
    return css


@register.simple_tag
def vite_asset(entry_name: str) -> str:
    """
    Get the hashed filename for a Vite asset from manifest.json

    Args:
        entry_name: The original entry name (e.g., 'index.ts')

    Returns:
        The hashed filename from the manifest (e.g., 'wordwallsapp.abc123.js')
    """
    manifest = _load_manifest()

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
def vite_css_assets(entry_name: str) -> list:
    """
    Every CSS file a Vite entry needs, in load order.

    Returns a list rather than one filename because an entry can legitimately
    own a stylesheet *and* pull shared ones in from a vendor chunk -- the Great
    Wall's animations plus Bootstrap, for instance. Returning only the first
    silently drops the rest, which looks like the page lost its styling.
    """
    return _collect_css(_load_manifest(), entry_name) or ["wordwallsapp.css"]


@register.simple_tag
def vite_css_asset(entry_name: str) -> str:
    """
    The first CSS file for an entry.

    Prefer vite_css_assets; this cannot express an entry with several
    stylesheets and is kept only so older templates keep working.
    """
    return vite_css_assets(entry_name)[0]
