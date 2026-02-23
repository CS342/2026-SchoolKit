import React, { useState } from 'react';
import type { InteractiveComponentObject, QuizConfig } from '../../types/document';
import { PreviewObject } from './PreviewObject';

export function PreviewQuiz({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as QuizConfig;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const questionGroup = object.groups.find((g) => g.role === 'question');
  const feedbackGroup = object.groups.find((g) => g.role === 'feedback');
  const questionChildren = object.children.filter((c) => questionGroup?.objectIds.includes(c.id));
  const feedbackChildren = object.children.filter((c) => feedbackGroup?.objectIds.includes(c.id));

  if (showFeedback && config.showFeedback) {
    return (
      <div
        style={{
          position: 'absolute',
          left: object.x,
          top: object.y,
          width: object.width,
          height: object.height,
          overflow: 'hidden',
        }}
      >
        {feedbackChildren.map((child) => (
          <PreviewObject key={child.id} object={child} />
        ))}
        <button
          onClick={() => {
            setSelectedIndex(null);
            setShowFeedback(false);
          }}
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 20px',
            borderRadius: 12,
            border: 'none',
            backgroundColor: '#7B68EE',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={() => {
        if (selectedIndex !== null) {
          setShowFeedback(true);
        }
      }}
    >
      {questionChildren.map((child) => (
        <PreviewObject key={child.id} object={child} />
      ))}
    </div>
  );
}
