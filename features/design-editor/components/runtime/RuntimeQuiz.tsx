import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import type { InteractiveComponentObject, QuizConfig } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';

export function RuntimeQuiz({ object, isDark = false }: { object: InteractiveComponentObject; isDark?: boolean }) {
  const config = object.interactionConfig as QuizConfig;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const questionGroup = object.groups.find((g) => g.role === 'question');
  const feedbackGroup = object.groups.find((g) => g.role === 'feedback');
  const questionChildren = object.children.filter((c) => questionGroup?.objectIds.includes(c.id));
  const feedbackChildren = object.children.filter((c) => feedbackGroup?.objectIds.includes(c.id));

  // Derive touch targets from actual child positions sorted by Y, skipping the
  // first child (usually the question text). Each option child defines its own
  // bounds via x/y/width/height from the design data.
  const sortedChildren = [...questionChildren].sort((a, b) => a.y - b.y);
  const optionChildren = sortedChildren.length > 1 ? sortedChildren.slice(1) : [];

  if (showFeedback && config.showFeedback) {
    const isCorrect = selectedIndex === config.correctIndex;
    return (
      <View
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
          <RuntimeObject key={child.id} object={child} parentWidth={object.width} isDark={isDark} />
        ))}
        <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{
            fontSize: 16, fontWeight: '600', marginBottom: 8,
            color: isCorrect
              ? (config.correctColor ?? (isDark ? '#86EFAC' : '#22C55E'))
              : (config.incorrectColor ?? (isDark ? '#FCA5A5' : '#EF4444')),
          }}>
            {isCorrect ? config.feedbackCorrect : config.feedbackIncorrect}
          </Text>
          <TouchableOpacity
            onPress={() => { setSelectedIndex(null); setShowFeedback(false); }}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={{
              paddingVertical: 8, paddingHorizontal: 20, borderRadius: 12,
              backgroundColor: config.buttonColor ?? '#7B68EE',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        overflow: 'hidden',
      }}
    >
      {questionChildren.map((child) => (
        <RuntimeObject key={child.id} object={child} parentWidth={object.width} isDark={isDark} />
      ))}

      {/* Overlay touch targets aligned with actual option children */}
      {config.options.map((option, i) => {
        const child = optionChildren[i];
        if (!child) return null;
        return (
          <TouchableOpacity
            key={i}
            onPress={() => {
              setSelectedIndex(i);
              setShowFeedback(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Option ${i + 1}: ${option}`}
            style={{
              position: 'absolute',
              left: child.x,
              top: child.y,
              width: child.width,
              height: child.height,
              borderRadius: 12,
              backgroundColor: selectedIndex === i ? (config.optionHighlight ?? 'rgba(123,104,238,0.1)') : 'transparent',
            }}
          />
        );
      })}
    </View>
  );
}
