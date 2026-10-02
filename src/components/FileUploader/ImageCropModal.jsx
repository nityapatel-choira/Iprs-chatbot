import { useRef, useState } from "react";
import styles from "./FileUploader.module.css";
import { t } from "../../i18n";
import PreviewModal from "./PreviewModal";

function ImageCropModal({ pendingFile, pendingPreviewUrl, onCancel, onConfirm }) {
  const imgRef = useRef(null);
  const [cropRect, setCropRect] = useState({ x: 5, y: 5, width: 90, height: 90 });
  const isDraggingHandle = useRef(false);
  const dragHandleType = useRef(null);
  const dragStartCoords = useRef({ x: 0, y: 0, rect: { x: 5, y: 5, width: 90, height: 90 } });

  const handlePointerDown = (handleType, e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingHandle.current = true;
    dragHandleType.current = handleType;
    dragStartCoords.current = {
      x: e.clientX,
      y: e.clientY,
      rect: { ...cropRect },
    };

    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore fallback
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingHandle.current || !imgRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const imgWidth = imgRef.current.clientWidth;
    const imgHeight = imgRef.current.clientHeight;
    if (!imgWidth || !imgHeight) return;

    const deltaX = ((e.clientX - dragStartCoords.current.x) / imgWidth) * 100;
    const deltaY = ((e.clientY - dragStartCoords.current.y) / imgHeight) * 100;
    const initialRect = dragStartCoords.current.rect;
    const handleType = dragHandleType.current;

    let { x, y, width, height } = initialRect;

    if (handleType === "nw") {
      const newX = Math.max(0, Math.min(initialRect.x + initialRect.width - 10, initialRect.x + deltaX));
      const newY = Math.max(0, Math.min(initialRect.y + initialRect.height - 10, initialRect.y + deltaY));
      width = initialRect.width - (newX - initialRect.x);
      height = initialRect.height - (newY - initialRect.y);
      x = newX;
      y = newY;
    } else if (handleType === "ne") {
      const newY = Math.max(0, Math.min(initialRect.y + initialRect.height - 10, initialRect.y + deltaY));
      width = Math.max(10, Math.min(100 - initialRect.x, initialRect.width + deltaX));
      height = initialRect.height - (newY - initialRect.y);
      y = newY;
    } else if (handleType === "sw") {
      const newX = Math.max(0, Math.min(initialRect.x + initialRect.width - 10, initialRect.x + deltaX));
      height = Math.max(10, Math.min(100 - initialRect.y, initialRect.height + deltaY));
      width = initialRect.width - (newX - initialRect.x);
      x = newX;
    } else if (handleType === "se") {
      width = Math.max(10, Math.min(100 - initialRect.x, initialRect.width + deltaX));
      height = Math.max(10, Math.min(100 - initialRect.y, initialRect.height + deltaY));
    }

    setCropRect({
      x: Math.max(0, Math.min(90, x)),
      y: Math.max(0, Math.min(90, y)),
      width: Math.max(10, Math.min(100 - x, width)),
      height: Math.max(10, Math.min(100 - y, height)),
    });
  };

  const handlePointerUp = (e) => {
    if (isDraggingHandle.current) {
      isDraggingHandle.current = false;
      dragHandleType.current = null;
      if (e.currentTarget.releasePointerCapture && e.pointerId !== undefined) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore fallback
        }
      }
    }
  };

  const handleConfirmCrop = () => {
    if (!pendingFile || !pendingPreviewUrl || !imgRef.current) return;

    const img = imgRef.current;
    const canvas = document.createElement("canvas");
    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;

    const cropX = (cropRect.x / 100) * naturalWidth;
    const cropY = (cropRect.y / 100) * naturalHeight;
    const cropW = (cropRect.width / 100) * naturalWidth;
    const cropH = (cropRect.height / 100) * naturalHeight;

    canvas.width = Math.max(1, Math.round(cropW));
    canvas.height = Math.max(1, Math.round(cropH));

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

    const fileMime = pendingFile.type && pendingFile.type.startsWith("image/") ? pendingFile.type : "image/jpeg";

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], pendingFile.name, {
            type: fileMime,
            lastModified: Date.now(),
          });
          onConfirm(croppedFile);
        } else {
          onCancel();
        }
      },
      fileMime,
      0.92
    );
  };

  return (
    <PreviewModal
      title={t("Crop & Adjust Document")}
      onCancel={onCancel}
      onConfirm={handleConfirmCrop}
      confirmLabel={t("Use Document")}
    >
      <div className={styles.cropImageWrapper}>
        <img
          ref={imgRef}
          src={pendingPreviewUrl}
          alt={t("Document preview")}
          className={styles.cropImage}
        />
        <div
          className={styles.cropSelectionBox}
          style={{
            left: `${cropRect.x}%`,
            top: `${cropRect.y}%`,
            width: `${cropRect.width}%`,
            height: `${cropRect.height}%`,
          }}
        >
          <span
            className={`${styles.cropHandle} ${styles.handleNw}`}
            onPointerDown={(e) => handlePointerDown("nw", e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <span
            className={`${styles.cropHandle} ${styles.handleNe}`}
            onPointerDown={(e) => handlePointerDown("ne", e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <span
            className={`${styles.cropHandle} ${styles.handleSw}`}
            onPointerDown={(e) => handlePointerDown("sw", e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <span
            className={`${styles.cropHandle} ${styles.handleSe}`}
            onPointerDown={(e) => handlePointerDown("se", e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        </div>
      </div>
    </PreviewModal>
  );
}

export default ImageCropModal;
