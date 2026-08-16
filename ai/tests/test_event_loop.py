import asyncio
import os
import sys
import unittest
from unittest.mock import patch


AI_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if AI_ROOT not in sys.path:
    sys.path.insert(0, AI_ROOT)

from config.event_loop import configure_asyncio_event_loop


class EventLoopConfigurationTests(unittest.TestCase):
    @unittest.skipUnless(hasattr(asyncio, "WindowsSelectorEventLoopPolicy"), "Windows-only policy")
    def test_windows_uses_selector_policy(self):
        with patch("config.event_loop.sys.platform", "win32"):
            configure_asyncio_event_loop()
        self.assertIsInstance(asyncio.get_event_loop_policy(), asyncio.WindowsSelectorEventLoopPolicy)


if __name__ == "__main__":
    unittest.main()
