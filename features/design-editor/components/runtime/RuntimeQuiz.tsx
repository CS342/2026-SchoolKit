import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import type { InteractiveComponentObject, QuizConfig } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';

export function RuntimeQuiz({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as QuizConfig;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const questionGroup = object.groups.find((g) => g.role === 'question');
  const feedbackGroup = object.groups.find((g) => g.role === 'feedback');
  const questionChildren = object.children.filter((c) => questionGroup?.objectIds.includes(c.id));
  const feedbackChildren = object.children.filter((c) => feedbackGroup?.objectIds.includes(c.id));

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
          <RuntimeObject key={child.id} object={child} parentWidth={object.width} />
        ))}
        <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: isCorrect ? '#22C55E' : '#EF4444', marginBottom: 8 }}>
            {isCorrect ? config.feedbackCorrect : config.feedbackIncorrect}
          </Text>
          <TouchableOpacity
            onPress={() => { setSelectedIndex(null); setShowFeedback(false); }}
            style={{
              paddingVertical: 8, paddingHorizontal: 20, borderRadius: 12,
              backgroundColor: '#7B68EE',
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
        <RuntimeObject key={child.id} object={child} parentWidth={object.width} />
      ))}

      {/* Overlay invisible touch targets on the option areas */}
      {config.options.map((option, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => {
            setSelectedIndex(i);
            setShowFeedback(true);
          }}
          style={{
            position: 'absolute',
            left: 20,
            top: 80 + i * 52,
            width: object.width - 40,
            height: 44,
            borderRadius: 12,
            backgroundColor: selectedIndex === i ? 'rgba(123,104,238,0.1)' : 'transparent',
          }}
        />
      ))}
    </View>
  );
}
