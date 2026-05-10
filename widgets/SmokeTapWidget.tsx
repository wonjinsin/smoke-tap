// Reference JSX for the iOS widget. Real build comes from the Swift in
// scripts/patch-widget.js — keep the tones in sync when changing either.
// Pre-existing type errors here (WidgetBase, EdgeInsets) predate this
// redesign and are unrelated; the file is reference-only.
import { Text, VStack, Button } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  buttonStyle,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

type SmokeTapProps = {
  count: number;
};

const SmokeTapWidget = (p: WidgetBase<SmokeTapProps>) => {
  'widget';

  return (
    <VStack spacing={6} modifiers={[padding(12)]}>
      <Text
        modifiers={[
          font({ size: 72, weight: 'ultraLight' }),
          foregroundStyle('#1A1815'),
        ]}
      >
        {p.count}
      </Text>
      <Button
        label="+"
        target="add-tap"
        modifiers={[
          buttonStyle('borderedProminent'),
          foregroundStyle('#FBF9F4'),
        ]}
        onPress={() => ({ count: p.count + 1 })}
      />
    </VStack>
  );
};

export default createWidget('SmokeTapWidget', SmokeTapWidget);
