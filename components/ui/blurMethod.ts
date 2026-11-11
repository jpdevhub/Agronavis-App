import { Platform } from 'react-native';
import * as Device from 'expo-device';

/**
 * Which Android blur the frosted bars may use.
 *
 * The Dimezis blur works by re-drawing the whole screen into a bitmap on every
 * frame and blurring it. On a flagship that is invisible; on a mid-range
 * phone — and on MIUI/HyperOS in particular — it is enough to stall the
 * screen behind a ScrollView, which then only repaints when the app is sent
 * to the background and brought back. Below Android 12 it also falls back to
 * RenderScript, which is slower still.
 *
 * Phones that cannot afford it get the translucent tint the bars already
 * carry, which is what the blur sits on anyway.
 */
const EIGHT_GB = 8 * 1024 * 1024 * 1024;

export const ANDROID_BLUR_METHOD: 'dimezisBlurView' | 'none' =
  Platform.OS === 'android'
  && typeof Platform.Version === 'number'
  && Platform.Version >= 31
  && (Device.totalMemory ?? 0) >= EIGHT_GB
    ? 'dimezisBlurView'
    : 'none';
