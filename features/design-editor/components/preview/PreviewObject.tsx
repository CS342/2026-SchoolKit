import React from 'react';
import type { StaticDesignObject } from '../../types/document';
import { objectToStyle, getTextContent } from '../../utils/objects-to-html';

export function PreviewObject({ object }: { object: StaticDesignObject }) {
  const style = objectToStyle(object);
  const text = getTextContent(object);

  return (
    <div style={style}>
      {text}
    </div>
  );
}
