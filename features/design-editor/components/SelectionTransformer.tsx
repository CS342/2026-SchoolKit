import React, { useRef, useEffect } from 'react';
import { Transformer } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '../store/editor-store';

interface SelectionTransformerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export function SelectionTransformer({ stageRef }: SelectionTransformerProps) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedIds = useEditorStore((s) => s.selectedIds);

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    const nodes = selectedIds
      .map((id) => stageRef.current!.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];

    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, stageRef]);

  if (selectedIds.length === 0) return null;

  return (
    <Transformer
      ref={transformerRef}
      borderStroke="#7B68EE"
      anchorStroke="#7B68EE"
      anchorFill="#fff"
      anchorSize={8}
      anchorCornerRadius={2}
      rotateAnchorOffset={20}
      enabledAnchors={[
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
        'middle-left',
        'middle-right',
        'top-center',
        'bottom-center',
      ]}
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < 5 || newBox.height < 5) return oldBox;
        return newBox;
      }}
    />
  );
}
