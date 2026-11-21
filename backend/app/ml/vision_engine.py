import io
import base64
from typing import Dict, Any, Optional
import numpy as np
import cv2

class ConstructionVisionEngine:
    """
    OpenCV-based visual comparison and structural change detection studio
    for civil works progress photographs.
    """

    def analyze_single_photo(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Extracts structural features, edge density, and color composition
        from a single civil construction photograph.
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Invalid or corrupted image format")

        h, w, c = img.shape
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Calculate Canny edge density (indicative of structural elements, reinforcement, scaffolding)
        edges = cv2.Canny(gray, 100, 200)
        edge_pixel_count = int(np.count_nonzero(edges))
        total_pixels = h * w
        edge_density_pct = round((edge_pixel_count / total_pixels) * 100, 2)

        # Estimate construction environment via color analysis
        # (Concrete grey, earth/soil tones, sky/blue)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Concrete / greyish tones (low saturation, mid-to-high value)
        grey_mask = cv2.inRange(hsv, np.array([0, 0, 40]), np.array([180, 50, 220]))
        concrete_pct = round((int(np.count_nonzero(grey_mask)) / total_pixels) * 100, 1)

        # Soil / earth tones (hue 10-25)
        soil_mask = cv2.inRange(hsv, np.array([10, 50, 50]), np.array([25, 255, 200]))
        soil_pct = round((int(np.count_nonzero(soil_mask)) / total_pixels) * 100, 1)

        # Rough estimated stage indicator based on visual heuristics
        if soil_pct > 35 and edge_density_pct < 6.0:
            stage_estimate = "Earthwork / Foundation Stage"
        elif concrete_pct > 30 and edge_density_pct > 8.0:
            stage_estimate = "Superstructure / RCC Framework Stage"
        elif edge_density_pct > 12.0:
            stage_estimate = "Active Construction / Scaffolding & Masonry"
        else:
            stage_estimate = "Finishing / Paved Surface / Site Prep"

        return {
            "image_dimensions": f"{w}x{h}",
            "edge_density_percentage": edge_density_pct,
            "surface_composition": {
                "concrete_masonry_index": concrete_pct,
                "soil_earthwork_index": soil_pct,
            },
            "heuristic_stage_indicator": stage_estimate,
            "disclaimer": "Photographic analysis estimates physical visual features only. It does NOT verify contractor authenticity, structural safety compliance, or financial disbursement eligibility."
        }

    def compare_progress_photos(self, img1_bytes: bytes, img2_bytes: bytes) -> Dict[str, Any]:
        """
        Performs visual differential analysis between earlier and later progress photos.
        """
        arr1 = np.frombuffer(img1_bytes, np.uint8)
        arr2 = np.frombuffer(img2_bytes, np.uint8)
        
        img1 = cv2.imdecode(arr1, cv2.IMREAD_COLOR)
        img2 = cv2.imdecode(arr2, cv2.IMREAD_COLOR)
        
        if img1 is None or img2 is None:
            raise ValueError("Could not decode one or both image buffers")

        # Resize img2 to match img1 dimensions for structural comparison
        h, w = 480, 640
        resized1 = cv2.resize(img1, (w, h))
        resized2 = cv2.resize(img2, (w, h))

        gray1 = cv2.cvtColor(resized1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(resized2, cv2.COLOR_BGR2GRAY)

        # Compute Absolute Pixel Difference
        diff = cv2.absdiff(gray1, gray2)
        _, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)
        changed_pixels = int(np.count_nonzero(thresh))
        change_percentage = round((changed_pixels / (w * h)) * 100, 2)

        # Feature matching using ORB to gauge viewpoint shift
        orb = cv2.ORB_create(nfeatures=500)
        kp1, des1 = orb.detectAndCompute(gray1, None)
        kp2, des2 = orb.detectAndCompute(gray2, None)
        
        match_count = 0
        if des1 is not None and des2 is not None and len(des1) > 0 and len(des2) > 0:
            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
            matches = bf.match(des1, des2)
            match_count = len(matches)

        # Build visual diff heatmap overlay
        heatmap = cv2.applyColorMap(diff, cv2.COLORMAP_JET)
        blended = cv2.addWeighted(resized2, 0.7, heatmap, 0.3, 0)
        _, buffer = cv2.imencode(".jpg", blended)
        heatmap_base64 = base64.b64encode(buffer).decode("utf-8")

        # Heuristic interpretation
        if change_percentage > 40:
            assessment = "Significant structural transformation detected between images."
        elif change_percentage > 15:
            assessment = "Moderate visible progress observed; incremental construction changes present."
        else:
            assessment = "Minimal visible variation between provided photos."

        return {
            "visible_change_percentage": change_percentage,
            "feature_alignment_matches": match_count,
            "comparative_assessment": assessment,
            "heatmap_preview_base64": f"data:image/jpeg;base64,{heatmap_base64}",
            "disclaimer": "Visual change percentage reflects pixel and luminance differentials which can be influenced by camera angle, lighting, and weather conditions. Must be correlated with official engineer inspection reports."
        }

vision_engine = ConstructionVisionEngine()
