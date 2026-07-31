# -*- coding: utf-8 -*-
"""
Tests for the Vite manifest template tags.

These exist because adding a second Vite entry (the Great Wall) changed
how Vite chunks CSS: with two entries importing the same stylesheets, the CSS is
hoisted out of the entries into a shared vendor chunk, and a direct
manifest[entry]["css"] lookup silently returns nothing. That broke the stylesheet
link on the *existing* wordwalls table page, not just the new one.
"""

from unittest import mock

from django.test import SimpleTestCase

from wordwalls.templatetags.vite_manifest import (
    vite_asset,
    vite_css_asset,
    vite_css_assets,
)

# A real two-entry manifest, as emitted by `npm run build:wordwalls`.
TWO_ENTRY_MANIFEST = {
    "index.ts": {
        "file": "wordwallsapp.Cjlpc5rL.js",
        "name": "index",
        "src": "index.ts",
        "isEntry": True,
        "imports": ["_vendor.BfUGkMaf.js"],
    },
    "infinite.ts": {
        "file": "infinitewallapp.CfTvGfPy.js",
        "name": "infinite",
        "src": "infinite.ts",
        "isEntry": True,
        "imports": ["_vendor.BfUGkMaf.js"],
    },
    "_vendor.BfUGkMaf.js": {
        "file": "vendor.BfUGkMaf.js",
        "name": "dark_mode",
        "isDynamicEntry": True,
        "css": ["wordwallsapp.DKX5c55w.css"],
    },
}

# The single-entry shape from before the infinite wall was added.
ONE_ENTRY_MANIFEST = {
    "index.ts": {
        "file": "wordwallsapp.zO25pwxa.js",
        "name": "index",
        "src": "index.ts",
        "isEntry": True,
        "css": ["wordwallsapp.DKX5c55w.css"],
    },
}


class ViteAssetTest(SimpleTestCase):
    def test_resolves_both_entries(self):
        with mock.patch(
            "wordwalls.templatetags.vite_manifest._load_manifest",
            return_value=TWO_ENTRY_MANIFEST,
        ):
            self.assertEqual(vite_asset("index.ts"), "wordwallsapp.Cjlpc5rL.js")
            self.assertEqual(vite_asset("infinite.ts"), "infinitewallapp.CfTvGfPy.js")

    def test_falls_back_without_a_manifest(self):
        with mock.patch(
            "wordwalls.templatetags.vite_manifest._load_manifest", return_value={}
        ):
            self.assertEqual(vite_asset("index.ts"), "wordwallsapp.js")


class ViteCssAssetTest(SimpleTestCase):
    def test_finds_css_hoisted_into_a_shared_chunk(self):
        """The regression: neither entry carries `css` in a two-entry build."""
        with mock.patch(
            "wordwalls.templatetags.vite_manifest._load_manifest",
            return_value=TWO_ENTRY_MANIFEST,
        ):
            self.assertEqual(
                vite_css_asset("index.ts"), "wordwallsapp.DKX5c55w.css"
            )
            self.assertEqual(
                vite_css_asset("infinite.ts"), "wordwallsapp.DKX5c55w.css"
            )

    def test_still_handles_css_directly_on_the_entry(self):
        with mock.patch(
            "wordwalls.templatetags.vite_manifest._load_manifest",
            return_value=ONE_ENTRY_MANIFEST,
        ):
            self.assertEqual(
                vite_css_asset("index.ts"), "wordwallsapp.DKX5c55w.css"
            )

    def test_prefers_the_entry_own_css_over_an_imported_chunks(self):
        manifest = {
            "index.ts": {
                "file": "a.js",
                "css": ["own.css"],
                "imports": ["_shared.js"],
            },
            "_shared.js": {"file": "s.js", "css": ["shared.css"]},
        }
        with mock.patch(
            "wordwalls.templatetags.vite_manifest._load_manifest",
            return_value=manifest,
        ):
            self.assertEqual(vite_css_asset("index.ts"), "own.css")

    def test_survives_a_cyclic_import_graph(self):
        manifest = {
            "index.ts": {"file": "a.js", "imports": ["_b.js"]},
            "_b.js": {"file": "b.js", "imports": ["_c.js"]},
            "_c.js": {"file": "c.js", "imports": ["_b.js"], "css": ["deep.css"]},
        }
        with mock.patch(
            "wordwalls.templatetags.vite_manifest._load_manifest",
            return_value=manifest,
        ):
            self.assertEqual(vite_css_asset("index.ts"), "deep.css")

    def test_falls_back_when_nothing_is_found(self):
        with mock.patch(
            "wordwalls.templatetags.vite_manifest._load_manifest", return_value={}
        ):
            self.assertEqual(vite_css_asset("infinite.ts"), "wordwallsapp.css")


class ViteCssAssetsTest(SimpleTestCase):
    """
    An entry can own a stylesheet *and* inherit shared ones from a vendor chunk.

    The Great Wall does exactly this: its animations CSS is its own chunk while
    Bootstrap lives on the shared vendor chunk. Returning just the first would
    drop Bootstrap from the page, which reads as the styling having vanished.
    """

    MIXED_MANIFEST = {
        "infinite.ts": {
            "file": "infinitewallapp.BH.js",
            "isEntry": True,
            "css": ["infinitewallapp.dvEi.css"],
            "imports": ["_vendor.Crm.js"],
        },
        "index.ts": {
            "file": "wordwallsapp.Cjl.js",
            "isEntry": True,
            "imports": ["_vendor.Crm.js"],
        },
        "_vendor.Crm.js": {
            "file": "vendor.Crm.js",
            "css": ["wordwallsapp.DKX.css"],
        },
    }

    def test_returns_every_stylesheet_an_entry_needs(self):
        with mock.patch(
            "wordwalls.templatetags.vite_manifest._load_manifest",
            return_value=self.MIXED_MANIFEST,
        ):
            self.assertEqual(
                vite_css_assets("infinite.ts"),
                ["infinitewallapp.dvEi.css", "wordwallsapp.DKX.css"],
            )

    def test_entry_own_css_loads_before_inherited(self):
        # Order matters: a page-specific sheet must be able to override shared
        # rules, which only works if it comes second in the document... but Vite
        # lists the owner first, so assert the order we actually emit.
        with mock.patch(
            "wordwalls.templatetags.vite_manifest._load_manifest",
            return_value=self.MIXED_MANIFEST,
        ):
            self.assertEqual(vite_css_assets("infinite.ts")[0], "infinitewallapp.dvEi.css")

    def test_entry_with_only_inherited_css(self):
        with mock.patch(
            "wordwalls.templatetags.vite_manifest._load_manifest",
            return_value=self.MIXED_MANIFEST,
        ):
            self.assertEqual(vite_css_assets("index.ts"), ["wordwallsapp.DKX.css"])

    def test_singular_tag_still_returns_the_first(self):
        with mock.patch(
            "wordwalls.templatetags.vite_manifest._load_manifest",
            return_value=self.MIXED_MANIFEST,
        ):
            self.assertEqual(vite_css_asset("index.ts"), "wordwallsapp.DKX.css")

    def test_falls_back_without_a_manifest(self):
        with mock.patch(
            "wordwalls.templatetags.vite_manifest._load_manifest", return_value={}
        ):
            self.assertEqual(vite_css_assets("infinite.ts"), ["wordwallsapp.css"])
