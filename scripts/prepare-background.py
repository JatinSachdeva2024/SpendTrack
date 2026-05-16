"""Remove LIFE/DEATH text from wallpaper; write public/background.jpg."""
import cv2
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC_NAME = (
    "c__Users_asusa_AppData_Roaming_Cursor_User_workspaceStorage_"
    "195f5251d44d06a86db60940c5208312_images_image-8d5e4839-83b1-427b-80c2-dc331612539f.png"
)
SRC_CANDIDATES = [
    ROOT / "assets" / SRC_NAME,
    Path(r"C:\Users\asusa\.cursor\projects\s-DOWNLOADS-WEbAPP-Tracker\assets") / SRC_NAME,
]
OUT = ROOT / "public" / "background.jpg"


def _keep_large_blobs(mask: np.ndarray, min_area: int = 90) -> np.ndarray:
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    out = np.zeros_like(mask)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= min_area:
            out[labels == i] = 255
    return out


def build_text_mask(gray: np.ndarray) -> np.ndarray:
    h, w = gray.shape
    mask = np.zeros((h, w), dtype=np.uint8)

    # Top (white): black Kanji + LIFE
    top = gray[: int(h * 0.52), : int(w * 0.78)]
    _, top_dark = cv2.threshold(top, 108, 255, cv2.THRESH_BINARY_INV)
    mask[: int(h * 0.52), : int(w * 0.78)] = top_dark

    # Bottom (black): white Kanji + DEATH
    bot = gray[int(h * 0.48) :, int(w * 0.22) :]
    _, bot_bright = cv2.threshold(bot, 168, 255, cv2.THRESH_BINARY)
    mask[int(h * 0.48) :, int(w * 0.22) :] = np.maximum(
        mask[int(h * 0.48) :, int(w * 0.22) :], bot_bright
    )

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    mask = cv2.dilate(mask, kernel, iterations=1)
    return _keep_large_blobs(mask, min_area=85)


def main() -> None:
    src = next((p for p in SRC_CANDIDATES if p.is_file()), None)
    if src is None:
        raise SystemExit(f"Could not find source image in {SRC_CANDIDATES}")

    img = cv2.imread(str(src))
    if img is None:
        raise SystemExit(f"Could not read {src}")

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mask = build_text_mask(gray)
    result = cv2.inpaint(img, mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(OUT), result, [int(cv2.IMWRITE_JPEG_QUALITY), 93])
    print(f"Wrote {OUT} ({w}x{h}) from {src.name}")


if __name__ == "__main__":
    main()
