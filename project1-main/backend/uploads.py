"""Cloudinary integration with mock fallback."""
import os
import time
import logging
from typing import Optional

log = logging.getLogger("oc.uploads")

CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")

ALLOWED_FOLDERS = ("products/", "users/", "uploads/")


def is_live() -> bool:
    return all([CLOUD_NAME, API_KEY, API_SECRET]) and "MOCKED" not in CLOUD_NAME


_initialized = False
if is_live():
    try:
        import cloudinary
        cloudinary.config(
            cloud_name=CLOUD_NAME,
            api_key=API_KEY,
            api_secret=API_SECRET,
            secure=True,
        )
        _initialized = True
        log.info("Cloudinary live client initialized")
    except Exception as e:
        log.warning(f"Cloudinary init failed, mocking: {e}")


def generate_signature(folder: str = "products/") -> dict:
    """Return signed-upload parameters for the frontend."""
    if not folder.startswith(ALLOWED_FOLDERS):
        raise ValueError(f"Folder must start with one of {ALLOWED_FOLDERS}")

    if not is_live() or not _initialized:
        return {
            "is_mock": True,
            "cloud_name": "mock",
            "api_key": "mock",
            "signature": "mock_signature",
            "timestamp": int(time.time()),
            "folder": folder,
        }

    import cloudinary.utils
    timestamp = int(time.time())
    params = {"timestamp": timestamp, "folder": folder}
    signature = cloudinary.utils.api_sign_request(params, API_SECRET)
    return {
        "is_mock": False,
        "cloud_name": CLOUD_NAME,
        "api_key": API_KEY,
        "signature": signature,
        "timestamp": timestamp,
        "folder": folder,
    }


def delete_asset(public_id: str) -> bool:
    if not is_live() or not _initialized:
        return True
    try:
        import cloudinary.uploader
        cloudinary.uploader.destroy(public_id, invalidate=True)
        return True
    except Exception as e:
        log.warning(f"Cloudinary delete failed: {e}")
        return False
