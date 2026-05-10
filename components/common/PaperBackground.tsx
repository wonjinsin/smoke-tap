import React from 'react';
import { ImageBackground, StyleSheet, View, type ViewStyle } from 'react-native';
import { C } from '../../constants/colors';

const grain = require('../../assets/textures/paper-grain.png');

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function PaperBackground({ children, style }: Props) {
  return (
    <View style={[styles.root, style]}>
      <ImageBackground
        source={grain}
        resizeMode="repeat"
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.BG,
  },
});
