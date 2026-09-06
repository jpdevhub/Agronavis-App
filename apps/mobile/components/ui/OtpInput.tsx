import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Shape, Spacing, Type } from '@/constants/theme';

interface OtpInputProps {
  length?: number;
  onComplete: (code: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: boolean;
}

/**
 * A single hidden field behind a row of boxes. One input keeps paste, autofill
 * and the SMS keyboard working, which per-digit inputs break.
 */
export function OtpInput({
  length = 6,
  onComplete,
  autoFocus = true,
  disabled = false,
  error = false,
}: OtpInputProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (value.length === length) onComplete(value);
  }, [value, length, onComplete]);

  const digits = Array.from({ length }, (_, index) => value[index] ?? '');

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.row}>
      {digits.map((digit, index) => {
        const active = focused && index === Math.min(value.length, length - 1);
        return (
          <View
            key={index}
            style={[
              styles.box,
              digit ? styles.boxFilled : null,
              active ? styles.boxActive : null,
              error ? styles.boxError : null,
            ]}
          >
            <Text style={styles.digit}>{digit}</Text>
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => setValue(text.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus={autoFocus}
        editable={!disabled}
        maxLength={length}
        style={styles.hidden}
        accessibilityLabel={`${length} digit verification code`}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  box: {
    width: 48,
    height: 56,
    borderRadius: Shape.small,
    borderWidth: 1,
    borderColor: Colors.outline,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: { backgroundColor: Colors.surfaceContainerHigh, borderColor: Colors.outlineVariant },
  boxActive: { borderColor: Colors.primary, borderWidth: 2 },
  boxError: { borderColor: Colors.error, borderWidth: 2 },
  digit: { ...Type.headlineSmall, color: Colors.onSurface },
  hidden: { position: 'absolute', opacity: 0, width: '100%', height: '100%' },
});
