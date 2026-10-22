// Drag-and-drop file attaching for the content AI (new-page modal + "Ask AI" bar).
// Web only: attaches native DOM drag listeners to the element behind a react-native-web
// View (pass `ref` to the drop zone) and reports dropped files. While enabled, a file
// dropped *outside* the zone is swallowed so the browser doesn't navigate away to open
// it and drop the author's unsaved work.
import { useCallback, useEffect, useRef, useState } from 'react';

const isWeb = typeof document !== 'undefined';

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');

export function useFileDrop(onFiles: (files: File[]) => void, enabled = true) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const onFilesRef = useRef(onFiles);
  onFilesRef.current = onFiles;

  // Callback ref: re-binds when the drop zone mounts/unmounts (e.g. the AI bar swaps
  // its input for the diff preview). Non-DOM refs (native) are ignored.
  const ref = useCallback((node: unknown) => {
    setEl(node && typeof (node as HTMLElement).addEventListener === 'function' ? (node as HTMLElement) : null);
  }, []);

  useEffect(() => {
    if (!isWeb || !el || !enabled) { setDragging(false); return; }
    // dragenter/dragleave fire for every child crossed; count depth to know when the
    // pointer has really left the zone.
    let depth = 0;
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth += 1;
      setDragging(true);
    };
    const over = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      depth = 0;
      setDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length) onFilesRef.current(files);
    };
    // Outside the zone: block the browser's default "open the file" navigation.
    const blockWindow = (e: DragEvent) => { if (hasFiles(e)) e.preventDefault(); };

    el.addEventListener('dragenter', enter);
    el.addEventListener('dragover', over);
    el.addEventListener('dragleave', leave);
    el.addEventListener('drop', drop);
    window.addEventListener('dragover', blockWindow);
    window.addEventListener('drop', blockWindow);
    return () => {
      el.removeEventListener('dragenter', enter);
      el.removeEventListener('dragover', over);
      el.removeEventListener('dragleave', leave);
      el.removeEventListener('drop', drop);
      window.removeEventListener('dragover', blockWindow);
      window.removeEventListener('drop', blockWindow);
    };
  }, [el, enabled]);

  return { ref, dragging };
}
