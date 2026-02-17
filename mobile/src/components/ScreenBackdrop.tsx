import { StyleSheet, View } from 'react-native';

export function ScreenBackdrop() {
  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={styles.topGlow} />
      <View style={styles.midGlow} />
      <View style={styles.bottomGlow} />
      <View style={styles.noiseMask} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  topGlow: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: '#1dd3b024',
    top: -180,
    right: -110,
  },
  midGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: '#45b6ff1a',
    top: '34%',
    left: -120,
  },
  bottomGlow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 999,
    backgroundColor: '#ff7a5915',
    bottom: -260,
    right: -140,
  },
  noiseMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff03',
  },
});
