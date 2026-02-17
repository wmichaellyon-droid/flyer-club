import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemePalette, useAppTheme, useThemeMode } from '../theme';

export function ScreenBackdrop() {
  const theme = useAppTheme();
  const mode = useThemeMode();
  const styles = useMemo(() => createStyles(theme, mode), [theme, mode]);

  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={styles.topGlow} />
      <View style={styles.midGlow} />
      <View style={styles.bottomGlow} />
      <View style={styles.noiseMask} />
    </View>
  );
}

const createStyles = (theme: ThemePalette, mode: 'light' | 'dark') =>
  StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: theme.bg,
  },
  topGlow: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: mode === 'dark' ? '#1dd3b024' : '#00000008',
    top: -180,
    right: -110,
  },
  midGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: mode === 'dark' ? '#45b6ff1a' : '#00000006',
    top: '34%',
    left: -120,
  },
  bottomGlow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 999,
    backgroundColor: mode === 'dark' ? '#ff7a5915' : '#00000005',
    bottom: -260,
    right: -140,
  },
  noiseMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: mode === 'dark' ? '#ffffff03' : '#00000003',
  },
  });
