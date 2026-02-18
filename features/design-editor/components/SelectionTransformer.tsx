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
  const updateObject = useEditorStore((s) => s.updateObject);

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
      onTransformEnd={() => {
        const nodes = transformerRef.current?.nodes() || [];
        nodes.forEach((node) => {
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);

          updateObject(node.id(), {
            x: Math.round(node.x()),
            y: Math.round(node.y()),
            width: Math.max(5, Math.round(node.width() * scaleX)),
            height: Math.max(5, Math.round(node.height() * scaleY)),
            rotation: Math.round(node.rotation() * 10) / 10,
          });
        });
      }}
    />
  );
}
