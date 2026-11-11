'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Crop,
  RotateCcw,
  RotateCw,
  FlipHorizontal2,
  X,
  Check,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import styles from './ImageCropModal.module.css';

export interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  title?: string;
  onClose: () => void;
  onSaveCropped: (newUrl: string) => void;
}

interface CropRect {
  x: number; // % 0..100
  y: number; // % 0..100
  width: number; // % 0..100
  height: number; // % 0..100
}

type DragHandle =
  | 'move'
  | 'nw'
  | 'ne'
  | 'sw'
  | 'se'
  | 'n'
  | 's'
  | 'w'
  | 'e';

const ASPECT_PRESETS: { label: string; value: number | null }[] = [
  { label: 'Livre', value: null },
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
];

const MIN_CROP_PCT = 5;

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const isRemote =
      src.startsWith('http://') || src.startsWith('https://');
    if (isRemote && typeof window !== 'undefined') {
      try {
        const url = new URL(src, window.location.href);
        if (url.origin !== window.location.origin) {
          img.crossOrigin = 'anonymous';
        }
      } catch {
        img.crossOrigin = 'anonymous';
      }
    }
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new Error(
          'Não foi possível carregar a imagem para edição. Se for um link externo, envie a foto do dispositivo.'
        )
      );
    img.src = src;
  });
}

function computeCenteredCropForRatio(
  ratio: number | null,
  imgW: number,
  imgH: number
): CropRect {
  if (!ratio || imgW <= 0 || imgH <= 0) {
    return { x: 5, y: 5, width: 90, height: 90 };
  }

  // Pixel aspect ratio of full image
  const imgRatio = imgW / imgH;
  let widthPct = 90;
  let heightPct = (widthPct * imgRatio) / ratio;

  if (heightPct > 90) {
    heightPct = 90;
    widthPct = (heightPct * ratio) / imgRatio;
  }

  return {
    x: (100 - widthPct) / 2,
    y: (100 - heightPct) / 2,
    width: widthPct,
    height: heightPct,
  };
}

export function ImageCropModal({
  isOpen,
  imageUrl,
  title = 'Ajustar e Cortar Foto',
  onClose,
  onSaveCropped,
}: ImageCropModalProps) {
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const [orientedDataUrl, setOrientedDataUrl] = useState<string>('');
  const [orientedSize, setOrientedSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const [crop, setCrop] = useState<CropRect>({
    x: 5,
    y: 5,
    width: 90,
    height: 90,
  });

  const [loadingImage, setLoadingImage] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    handle: DragHandle;
    startClientX: number;
    startClientY: number;
    startCrop: CropRect;
    wrapperWidth: number;
    wrapperHeight: number;
  } | null>(null);

  // Reset all settings whenever modal opens for a new image
  useEffect(() => {
    if (!isOpen) return;
    setRotation(0);
    setFlipH(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setAspectRatio(null);
    setError('');
    setSaving(false);
  }, [isOpen, imageUrl]);

  // Render oriented canvas whenever source image, rotation, or flip changes
  useEffect(() => {
    if (!isOpen || !imageUrl) return;
    let cancelled = false;

    const buildOriented = async () => {
      setLoadingImage(true);
      setError('');
      try {
        const img = await loadImageElement(imageUrl);
        if (cancelled) return;

        const normRot = ((rotation % 360) + 360) % 360;
        const swap = normRot === 90 || normRot === 270;
        const targetW = swap ? img.naturalHeight : img.naturalWidth;
        const targetH = swap ? img.naturalWidth : img.naturalHeight;

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Erro ao inicializar editor de imagem.');

        ctx.save();
        ctx.translate(targetW / 2, targetH / 2);
        ctx.rotate((normRot * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, 1);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        ctx.restore();

        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/png');
        } catch {
          throw new Error(
            'Esta imagem externa bloqueia edição por segurança (CORS). Envie o arquivo do seu aparelho para cortar.'
          );
        }

        if (cancelled) return;
        setOrientedDataUrl(dataUrl);
        setOrientedSize({ w: targetW, h: targetH });
        setCrop((prev) =>
          aspectRatio
            ? computeCenteredCropForRatio(aspectRatio, targetW, targetH)
            : {
                x: clamp(prev.x, 0, 90),
                y: clamp(prev.y, 0, 90),
                width: clamp(prev.width, MIN_CROP_PCT, 100),
                height: clamp(prev.height, MIN_CROP_PCT, 100),
              }
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Erro ao preparar imagem para corte.'
          );
        }
      } finally {
        if (!cancelled) setLoadingImage(false);
      }
    };

    buildOriented();
    return () => {
      cancelled = true;
    };
  }, [isOpen, imageUrl, rotation, flipH, aspectRatio]);

  // Apply aspect ratio change immediately
  const handleSelectAspect = (newRatio: number | null) => {
    setAspectRatio(newRatio);
    if (newRatio === null) return;
    if (orientedSize.w > 0 && orientedSize.h > 0) {
      setCrop(
        computeCenteredCropForRatio(newRatio, orientedSize.w, orientedSize.h)
      );
    }
  };

  const handleResetAll = () => {
    setRotation(0);
    setFlipH(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setAspectRatio(null);
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
  };

  // Pointer drag / resize handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, handle: DragHandle) => {
      e.preventDefault();
      e.stopPropagation();
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const rect = wrapper.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      dragStateRef.current = {
        handle,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startCrop: { ...crop },
        wrapperWidth: rect.width,
        wrapperHeight: rect.height,
      };
    },
    [crop]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerMove = (e: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;

      const dxPct =
        ((e.clientX - drag.startClientX) / drag.wrapperWidth) * 100;
      const dyPct =
        ((e.clientY - drag.startClientY) / drag.wrapperHeight) * 100;

      const s = drag.startCrop;

      if (drag.handle === 'move') {
        const nextX = clamp(s.x + dxPct, 0, 100 - s.width);
        const nextY = clamp(s.y + dyPct, 0, 100 - s.height);
        setCrop({ ...s, x: nextX, y: nextY });
        return;
      }

      // Edges/corners
      let left = s.x;
      let top = s.y;
      let right = s.x + s.width;
      let bottom = s.y + s.height;

      if (drag.handle.includes('w')) {
        left = clamp(s.x + dxPct, 0, right - MIN_CROP_PCT);
      }
      if (drag.handle.includes('e')) {
        right = clamp(s.x + s.width + dxPct, left + MIN_CROP_PCT, 100);
      }
      if (drag.handle.includes('n')) {
        top = clamp(s.y + dyPct, 0, bottom - MIN_CROP_PCT);
      }
      if (drag.handle.includes('s')) {
        bottom = clamp(s.y + s.height + dyPct, top + MIN_CROP_PCT, 100);
      }

      if (aspectRatio && orientedSize.w > 0 && orientedSize.h > 0) {
        // pctWidth / pctHeight = aspectRatio * (imgH / imgW)
        const pctRatio = aspectRatio * (orientedSize.h / orientedSize.w);
        let newW = right - left;
        let newH = newW / pctRatio;

        if (drag.handle.includes('n')) {
          if (bottom - newH < 0) {
            newH = bottom;
            newW = newH * pctRatio;
          }
          if (drag.handle.includes('w')) {
            left = right - newW;
            if (left < 0) {
              left = 0;
              newW = right;
              newH = newW / pctRatio;
            }
          } else {
            right = left + newW;
            if (right > 100) {
              right = 100;
              newW = 100 - left;
              newH = newW / pctRatio;
            }
          }
          top = bottom - newH;
        } else {
          if (top + newH > 100) {
            newH = 100 - top;
            newW = newH * pctRatio;
          }
          if (drag.handle.includes('w')) {
            left = right - newW;
            if (left < 0) {
              left = 0;
              newW = right;
              newH = newW / pctRatio;
            }
          } else {
            right = left + newW;
            if (right > 100) {
              right = 100;
              newW = 100 - left;
              newH = newW / pctRatio;
            }
          }
          bottom = top + newH;
        }
      }

      setCrop({
        x: left,
        y: top,
        width: Math.max(MIN_CROP_PCT, right - left),
        height: Math.max(MIN_CROP_PCT, bottom - top),
      });
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isOpen, aspectRatio, orientedSize]);

  const handleSave = async () => {
    if (!orientedDataUrl || orientedSize.w <= 0 || orientedSize.h <= 0) return;

    setSaving(true);
    setError('');
    try {
      const img = await loadImageElement(orientedDataUrl);

      const sx = Math.round((crop.x / 100) * orientedSize.w);
      const sy = Math.round((crop.y / 100) * orientedSize.h);
      const sw = Math.max(10, Math.round((crop.width / 100) * orientedSize.w));
      const sh = Math.max(
        10,
        Math.round((crop.height / 100) * orientedSize.h)
      );

      const outCanvas = document.createElement('canvas');
      outCanvas.width = sw;
      outCanvas.height = sh;
      const ctx = outCanvas.getContext('2d');
      if (!ctx) throw new Error('Erro ao processar imagem recortada.');

      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      const isPng = imageUrl.toLowerCase().includes('.png');
      const mimeType = isPng ? 'image/png' : 'image/jpeg';
      const ext = isPng ? 'png' : 'jpg';

      const blob = await new Promise<Blob | null>((resolve) =>
        outCanvas.toBlob(resolve, mimeType, isPng ? undefined : 0.92)
      );

      if (!blob) {
        throw new Error('Falha ao gerar arquivo da imagem recortada.');
      }

      const formData = new FormData();
      formData.append('file', blob, `recorte-${Date.now()}.${ext}`);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Erro ao enviar imagem ajustada.');
      }

      onSaveCropped(data.url);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao salvar foto ajustada.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const pixelW = Math.round((crop.width / 100) * orientedSize.w);
  const pixelH = Math.round((crop.height / 100) * orientedSize.h);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <Crop size={18} color="#9C7A3C" />
            <h3 className={styles.title}>{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={styles.closeBtn}
            title="Fechar editor"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.stageContainer}>
            {orientedDataUrl ? (
              <div ref={wrapperRef} className={styles.cropWrapper}>
                <img
                  src={orientedDataUrl}
                  alt="Pré-visualização para recorte"
                  className={styles.sourceImg}
                  draggable={false}
                  style={{
                    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                  }}
                />

                <div
                  className={styles.cropBox}
                  style={{
                    left: `${crop.x}%`,
                    top: `${crop.y}%`,
                    width: `${crop.width}%`,
                    height: `${crop.height}%`,
                  }}
                  onPointerDown={(e) => handlePointerDown(e, 'move')}
                >
                  <div className={styles.gridLinesH1} />
                  <div className={styles.gridLinesH2} />
                  <div className={styles.gridLinesV1} />
                  <div className={styles.gridLinesV2} />

                  <div
                    className={`${styles.handle} ${styles.handleNW}`}
                    onPointerDown={(e) => handlePointerDown(e, 'nw')}
                  />
                  <div
                    className={`${styles.handle} ${styles.handleNE}`}
                    onPointerDown={(e) => handlePointerDown(e, 'ne')}
                  />
                  <div
                    className={`${styles.handle} ${styles.handleSW}`}
                    onPointerDown={(e) => handlePointerDown(e, 'sw')}
                  />
                  <div
                    className={`${styles.handle} ${styles.handleSE}`}
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                  />

                  {aspectRatio === null && (
                    <>
                      <div
                        className={`${styles.handle} ${styles.handleN}`}
                        onPointerDown={(e) => handlePointerDown(e, 'n')}
                      />
                      <div
                        className={`${styles.handle} ${styles.handleS}`}
                        onPointerDown={(e) => handlePointerDown(e, 's')}
                      />
                      <div
                        className={`${styles.handle} ${styles.handleW}`}
                        onPointerDown={(e) => handlePointerDown(e, 'w')}
                      />
                      <div
                        className={`${styles.handle} ${styles.handleE}`}
                        onPointerDown={(e) => handlePointerDown(e, 'e')}
                      />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <span style={{ color: '#D6D0C4', fontSize: 13 }}>
                {loadingImage ? 'Carregando imagem...' : 'Sem imagem'}
              </span>
            )}

            {orientedSize.w > 0 && (
              <div className={styles.dimensionsBadge}>
                Corte: {pixelW} × {pixelH} px
              </div>
            )}
          </div>

          <div className={styles.sidebar}>
            <div className={styles.controlGroup}>
              <div className={styles.controlTitle}>Proporção do Corte</div>
              <div className={styles.ratioGrid}>
                {ASPECT_PRESETS.map((preset) => {
                  const active = aspectRatio === preset.value;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleSelectAspect(preset.value)}
                      className={`${styles.ratioBtn} ${
                        active ? styles.ratioBtnActive : ''
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.controlGroup}>
              <div className={styles.controlTitle}>Girar e Espelhar</div>
              <div className={styles.transformRow}>
                <button
                  type="button"
                  onClick={() => setRotation((r) => r - 90)}
                  className={styles.toolBtn}
                  title="Girar 90° para a esquerda"
                >
                  <RotateCcw size={14} /> -90°
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => r + 90)}
                  className={styles.toolBtn}
                  title="Girar 90° para a direita"
                >
                  <RotateCw size={14} /> +90°
                </button>
                <button
                  type="button"
                  onClick={() => setFlipH((f) => !f)}
                  className={`${styles.toolBtn} ${
                    flipH ? styles.toolBtnActive : ''
                  }`}
                  title="Espelhar horizontalmente"
                >
                  <FlipHorizontal2 size={14} /> Espelhar
                </button>
              </div>
            </div>

            <div className={styles.controlGroup}>
              <div className={styles.controlTitle}>Ajustes de Cor e Luz</div>

              <div className={styles.sliderRow}>
                <div className={styles.sliderHeader}>
                  <span>Brilho</span>
                  <span>{brightness}%</span>
                </div>
                <input
                  type="range"
                  min={70}
                  max={140}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className={styles.sliderInput}
                />
              </div>

              <div className={styles.sliderRow}>
                <div className={styles.sliderHeader}>
                  <span>Contraste</span>
                  <span>{contrast}%</span>
                </div>
                <input
                  type="range"
                  min={75}
                  max={140}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className={styles.sliderInput}
                />
              </div>

              <div className={styles.sliderRow}>
                <div className={styles.sliderHeader}>
                  <span>Saturação</span>
                  <span>{saturation}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={140}
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className={styles.sliderInput}
                />
              </div>

              <button
                type="button"
                onClick={handleResetAll}
                className={styles.resetLinkBtn}
              >
                <RefreshCw size={12} /> Restaurar tudo ao original
              </button>
            </div>

            {error && (
              <div className={styles.errorAlert}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={styles.cancelBtn}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loadingImage || !orientedDataUrl}
            className={styles.saveBtn}
          >
            <Check size={15} />
            <span>{saving ? 'Salvando recorte...' : 'Aplicar Foto'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
