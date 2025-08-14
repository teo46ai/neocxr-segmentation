# apps/api/app/api/v1/endpoints/dicom.py
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from pathlib import Path
import pydicom
from PIL import Image
import numpy as np
import io

from app.core.deps import get_db, get_current_user
from app.models.models import Instance, User
from app.core.config import settings

router = APIRouter()

@router.get("/{instance_id}/p10")
async def get_dicom_file(
    instance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get DICOM P10 file for Cornerstone loading"""
    instance = db.query(Instance).filter(Instance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    file_path = Path(instance.path_abs)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="DICOM file not found on disk")
    
    return FileResponse(
        path=str(file_path),
        media_type="application/dicom",
        headers={
            "Content-Disposition": f"attachment; filename={instance.sop_uid}.dcm",
            "Cache-Control": "public, max-age=3600"
        }
    )

@router.get("/{instance_id}/meta")
async def get_instance_metadata(
    instance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get instance metadata"""
    instance = db.query(Instance).filter(Instance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    return {
        "id": instance.id,
        "sop_uid": instance.sop_uid,
        "study_uid": instance.study.study_uid,
        "frame_count": instance.frame_count,
        "meta": instance.meta_json
    }

@router.get("/{instance_id}/frame/{frame_number}")
async def get_frame_image(
    instance_id: int,
    frame_number: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific frame as PNG for thumbnails/preview"""
    instance = db.query(Instance).filter(Instance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    file_path = Path(instance.path_abs)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="DICOM file not found")
    
    try:
        # Read DICOM file
        ds = pydicom.dcmread(str(file_path))
        
        # Get pixel array
        pixel_array = ds.pixel_array
        
        # Handle multi-frame
        if len(pixel_array.shape) == 3:
            if frame_number >= pixel_array.shape[0]:
                raise HTTPException(status_code=400, detail="Frame number out of range")
            pixel_array = pixel_array[frame_number]
        elif frame_number > 0:
            raise HTTPException(status_code=400, detail="Single frame image, frame number must be 0")
        
        # Apply window/level if available
        window_center = float(getattr(ds, 'WindowCenter', None) or pixel_array.mean())
        window_width = float(getattr(ds, 'WindowWidth', None) or (pixel_array.max() - pixel_array.min()))
        
        # Apply windowing
        img_min = window_center - window_width / 2
        img_max = window_center + window_width / 2
        
        pixel_array = np.clip(pixel_array, img_min, img_max)
        pixel_array = ((pixel_array - img_min) / (img_max - img_min) * 255).astype(np.uint8)
        
        # Convert to PIL Image
        img = Image.fromarray(pixel_array, mode='L')
        
        # Convert to PNG bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        return StreamingResponse(
            io.BytesIO(img_bytes.read()),
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=3600"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing DICOM: {str(e)}")

@router.get("/{instance_id}/thumbnail")
async def get_thumbnail(
    instance_id: int,
    size: int = 256,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get thumbnail image"""
    instance = db.query(Instance).filter(Instance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    # Check if thumbnail exists
    if instance.thumbnail_path and Path(instance.thumbnail_path).exists():
        return FileResponse(
            path=instance.thumbnail_path,
            media_type="image/jpeg",
            headers={"Cache-Control": "public, max-age=3600"}
        )
    
    # Generate thumbnail on-the-fly if not exists
    try:
        file_path = Path(instance.path_abs)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="DICOM file not found")
        
        ds = pydicom.dcmread(str(file_path))
        pixel_array = ds.pixel_array
        
        if len(pixel_array.shape) == 3:
            pixel_array = pixel_array[0]  # First frame only
        
        # Window level adjustment
        window_center = float(getattr(ds, 'WindowCenter', pixel_array.mean()))
        window_width = float(getattr(ds, 'WindowWidth', pixel_array.max() - pixel_array.min()))
        
        img_min = window_center - window_width / 2
        img_max = window_center + window_width / 2
        
        pixel_array = np.clip(pixel_array, img_min, img_max)
        pixel_array = ((pixel_array - img_min) / (img_max - img_min) * 255).astype(np.uint8)
        
        # Create and resize image
        img = Image.fromarray(pixel_array)
        img.thumbnail((size, size), Image.Resampling.LANCZOS)
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG', quality=85)
        img_bytes.seek(0)
        
        return StreamingResponse(
            io.BytesIO(img_bytes.read()),
            media_type="image/jpeg",
            headers={"Cache-Control": "public, max-age=3600"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating thumbnail: {str(e)}")