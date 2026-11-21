from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.app.ml.vision_engine import vision_engine

router = APIRouter(prefix="/ai", tags=["AI Vision Intelligence"])

@router.post("/image-analysis")
async def analyze_construction_photos(
    image1: UploadFile = File(...),
    image2: Optional[UploadFile] = File(None),
):
    """
    OpenCV computer vision endpoint analyzing structural features and physical
    progress differentials across construction photos.
    """
    try:
        bytes1 = await image1.read()
        if len(bytes1) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image 1 exceeds 10MB limit")

        # If only 1 image provided -> Single photo structural analysis
        if image2 is None:
            analysis = vision_engine.analyze_single_photo(bytes1)
            return {
                "mode": "SINGLE_PHOTO_ANALYSIS",
                "filename": image1.filename,
                "analysis": analysis
            }

        # If 2 images provided -> Differential progress comparison
        bytes2 = await image2.read()
        if len(bytes2) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image 2 exceeds 10MB limit")

        comparison = vision_engine.compare_progress_photos(bytes1, bytes2)
        single_photo1 = vision_engine.analyze_single_photo(bytes1)
        single_photo2 = vision_engine.analyze_single_photo(bytes2)

        return {
            "mode": "COMPARATIVE_PROGRESS_ANALYSIS",
            "baseline_image": image1.filename,
            "latest_image": image2.filename,
            "baseline_assessment": single_photo1,
            "latest_assessment": single_photo2,
            "comparison": comparison
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing error: {str(e)}")
