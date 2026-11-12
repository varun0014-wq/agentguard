"""
Smart Scanner API routes for AgentGuard.
Feature 4: Receipt image OCR, structured extraction, and QR code security decoding.
"""

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.scanner_service import scanner_service
from backend.schemas import (
    ReceiptScanResponse,
    ReceiptConfirmRequest,
    QRScanResponse,
)

router = APIRouter(prefix="/scanner", tags=["Smart Scanner"])


@router.post("/receipt", response_model=ReceiptScanResponse, status_code=status.HTTP_201_CREATED, summary="Scan receipt image")
async def scan_receipt(
    file: UploadFile = File(..., description="Uploaded receipt image (PNG, JPG, WEBP, PDF up to 10MB)"),
    db: Session = Depends(get_db),
):
    """
    Accepts an uploaded receipt image, performs OCR/heuristic parsing,
    and returns structured financial data (merchant, amount, currency, items, date)
    for user confirmation before recording.
    """
    receipt = await scanner_service.process_receipt_image(db, file, user_id="default_user")
    return ReceiptScanResponse(
        scan_id=receipt.id,
        merchant=receipt.merchant,
        total_amount=receipt.total_amount,
        currency=receipt.currency,
        date=receipt.date,
        items=receipt.items_json or [],
        raw_text=receipt.raw_text or "",
        status=receipt.status,
        requires_confirmation=True,
        message="Receipt scanned successfully. User confirmation required before ledger entry.",
    )


@router.post("/qr", response_model=QRScanResponse, status_code=status.HTTP_201_CREATED, summary="Scan QR / barcode image")
async def scan_qr_code(
    file: UploadFile = File(..., description="Uploaded QR code image"),
    db: Session = Depends(get_db),
):
    """
    Decodes QR/barcode image and extracts payment-related intent payload.
    Zero-trust security: Never automatically executes payment without human confirmation.
    """
    qr_record = await scanner_service.process_qr_image(db, file, user_id="default_user")
    return QRScanResponse(
        scan_id=qr_record.id,
        raw_data=qr_record.raw_data,
        qr_type=qr_record.qr_type,
        is_valid_payment=qr_record.is_valid_payment,
        payment_details=qr_record.parsed_payload_json,
        validation_notes=qr_record.validation_notes or "Decoded payment intent.",
    )


@router.get("/{scan_id}", response_model=ReceiptScanResponse, summary="Retrieve scan results by ID")
def get_scan_details(scan_id: str, db: Session = Depends(get_db)):
    """
    Retrieves stored receipt scan details and items by scan ID.
    """
    receipt = scanner_service.get_scan(db, scan_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Scan record not found")

    return ReceiptScanResponse(
        scan_id=receipt.id,
        merchant=receipt.merchant,
        total_amount=receipt.total_amount,
        currency=receipt.currency,
        date=receipt.date,
        items=receipt.items_json or [],
        raw_text=receipt.raw_text or "",
        status=receipt.status,
        requires_confirmation=receipt.status == "PENDING_CONFIRMATION",
        message="Scan retrieved.",
    )
