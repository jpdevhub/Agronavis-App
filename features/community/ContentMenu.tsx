/**
 * The overflow menu on a post or a reply: report it, block whoever wrote it,
 * or delete it when it is your own.
 *
 * Every one of those is a decision a farmer should be able to take back out
 * of, so the sheet asks before it acts and says plainly what will happen.
 */
import { useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { Loader } from '@/components/ui';
import { showAlert } from '@/utils/alert';
import {
  REPORT_REASONS, type ReportReason,
  useBlockFarmer, useDeleteContent, useReportContent,
} from '@/hooks/useCommunitySafety';

export type ContentTarget = {
  type: 'post' | 'reply';
  id: string;
  /** Your own writing gets Delete instead of Report and Block. */
  isOwn: boolean;
  authorId: string | null;
  authorName: string | null;
};

type Step = 'menu' | 'reason' | 'block' | 'delete';

const ICON_SIZE = 20;

export function ContentMenu({ target, onRemoved }: {
  target: ContentTarget;
  /** Called once the thing is gone from the feed, so a sheet above it can close. */
  onRemoved?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={styles.trigger}
        hitSlop={8}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={target.isOwn ? 'Options for your post' : 'Report or block'}
      >
        <MaterialIcons name="more-vert" size={ICON_SIZE} color={Colors.onSurfaceVariant} />
      </TouchableOpacity>

      {/* Mounted only while open: a feed of thirty posts should not carry
          thirty modals around with it. */}
      {open ? (
        <ContentMenuSheet
          target={target}
          onClose={() => setOpen(false)}
          onRemoved={() => { setOpen(false); onRemoved?.(); }}
        />
      ) : null}
    </>
  );
}

function ContentMenuSheet({ target, onClose, onRemoved }: {
  target: ContentTarget;
  onClose: () => void;
  onRemoved: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('menu');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [alsoBlock, setAlsoBlock] = useState(false);

  const report = useReportContent();
  const block = useBlockFarmer();
  const remove = useDeleteContent();
  const busy = report.isPending || block.isPending || remove.isPending;

  const noun = target.type === 'post' ? 'post' : 'comment';
  const who = target.authorName?.trim() || 'this farmer';

  async function submitReport() {
    if (!reason) return;
    try {
      await report.mutateAsync({ type: target.type, id: target.id, reason });
      if (alsoBlock && target.authorId) await block.mutateAsync(target.authorId);

      showAlert(
        'Thank you for telling us',
        alsoBlock
          ? `We will look at this ${noun} within 24 hours. You will not see ${who} in the feed any more.`
          : `We will look at this ${noun} within 24 hours.`,
      );
      onRemoved();
    } catch {
      showAlert('Could not send the report', 'Check your connection and try once more.');
    }
  }

  async function submitBlock() {
    if (!target.authorId) return;
    try {
      await block.mutateAsync(target.authorId);
      showAlert('Blocked', `You will not see ${who}'s posts or comments any more.`);
      onRemoved();
    } catch {
      showAlert('Could not block', 'Check your connection and try once more.');
    }
  }

  async function submitDelete() {
    try {
      await remove.mutateAsync({ type: target.type, id: target.id });
      onRemoved();
    } catch {
      showAlert('Could not delete', `Your ${noun} is still there. Try once more.`);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={busy ? undefined : onClose} />
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.handle} />

          {step === 'menu' ? (
            <>
              {target.isOwn ? (
                <Row
                  icon="delete-outline"
                  label={`Delete my ${noun}`}
                  hint="It is removed for everyone."
                  tone="danger"
                  onPress={() => setStep('delete')}
                />
              ) : (
                <>
                  <Row
                    icon="flag"
                    label={`Report this ${noun}`}
                    hint="Tell us what is wrong with it."
                    onPress={() => setStep('reason')}
                  />
                  {target.authorId ? (
                    <Row
                      icon="block"
                      label={`Block ${who}`}
                      hint="Their posts and comments disappear from your feed."
                      tone="danger"
                      onPress={() => setStep('block')}
                    />
                  ) : null}
                </>
              )}
              <Row icon="close" label="Cancel" onPress={onClose} />
            </>
          ) : null}

          {step === 'reason' ? (
            <>
              <Header title={`Report this ${noun}`} onBack={() => setStep('menu')} />
              <Text style={styles.sheetBody}>
                Pick the reason that fits best. Nobody is told who reported it.
              </Text>

              <ScrollView style={styles.reasonList} keyboardShouldPersistTaps="handled">
                {REPORT_REASONS.map(({ key, label }) => {
                  const picked = reason === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.reason, picked && styles.reasonPicked]}
                      onPress={() => setReason(key)}
                      activeOpacity={0.85}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: picked }}
                    >
                      <MaterialIcons
                        name={picked ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={ICON_SIZE}
                        color={picked ? Colors.primary : Colors.outline}
                      />
                      <Text style={[styles.reasonLabel, picked && styles.reasonLabelPicked]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {target.authorId ? (
                <TouchableOpacity
                  style={styles.checkRow}
                  onPress={() => setAlsoBlock(v => !v)}
                  activeOpacity={0.85}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: alsoBlock }}
                >
                  <MaterialIcons
                    name={alsoBlock ? 'check-box' : 'check-box-outline-blank'}
                    size={22}
                    color={alsoBlock ? Colors.primary : Colors.outline}
                  />
                  <Text style={styles.checkLabel}>Block {who} as well</Text>
                </TouchableOpacity>
              ) : null}

              <Actions
                confirmLabel="Send report"
                disabled={!reason}
                busy={busy}
                onCancel={onClose}
                onConfirm={submitReport}
              />
            </>
          ) : null}

          {step === 'block' ? (
            <>
              <Header title={`Block ${who}?`} onBack={() => setStep('menu')} />
              <Text style={styles.sheetBody}>
                Their posts and comments will not appear for you, and they will not see yours.
                You can undo this from your profile at any time.
              </Text>
              <Actions
                confirmLabel="Block"
                tone="danger"
                busy={busy}
                onCancel={onClose}
                onConfirm={submitBlock}
              />
            </>
          ) : null}

          {step === 'delete' ? (
            <>
              <Header title={`Delete this ${noun}?`} onBack={() => setStep('menu')} />
              <Text style={styles.sheetBody}>
                It is removed for everyone and cannot be brought back.
              </Text>
              <Actions
                confirmLabel="Delete"
                tone="danger"
                busy={busy}
                onCancel={onClose}
                onConfirm={submitDelete}
              />
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
        <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
      </TouchableOpacity>
      <Text style={styles.sheetTitle} numberOfLines={2}>{title}</Text>
    </View>
  );
}

function Row({ icon, label, hint, tone, onPress }: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  hint?: string;
  tone?: 'danger';
  onPress: () => void;
}) {
  const colour = tone === 'danger' ? Colors.error : Colors.onSurface;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8} accessibilityRole="button">
      <MaterialIcons name={icon} size={22} color={colour} />
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colour }]}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

function Actions({ confirmLabel, onConfirm, onCancel, busy, disabled, tone }: {
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
  disabled?: boolean;
  tone?: 'danger';
}) {
  const bg = tone === 'danger' ? Colors.error : Colors.primary;
  const fg = tone === 'danger' ? Colors.onError : Colors.onPrimary;
  return (
    <View style={styles.actions}>
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={onCancel}
        disabled={busy}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.confirmBtn, { backgroundColor: bg }, (disabled || busy) && styles.confirmOff]}
        onPress={onConfirm}
        disabled={disabled || busy}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        {busy
          ? <Loader tone="onColor" size={22} />
          : <Text style={[styles.confirmText, { color: fg }]}>{confirmLabel}</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: { padding: Spacing.xs, borderRadius: Shape.full },

  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.32)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: Shape.extraLarge,
    borderTopRightRadius: Shape.extraLarge,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    ...Elevation.level3,
  },
  handle: {
    width: 32, height: 4, borderRadius: Shape.full,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center', marginBottom: Spacing.md,
  },

  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  sheetTitle: { ...TypeEmphasized.titleMedium, color: Colors.onSurface, flex: 1 },
  sheetBody: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, marginBottom: Spacing.md },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    paddingVertical: Spacing.md, minHeight: 56,
  },
  rowText: { flex: 1 },
  rowLabel: { ...TypeEmphasized.bodyLarge },
  rowHint: { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginTop: 2 },

  reasonList: { maxHeight: 268 },
  reason: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    borderRadius: Shape.medium, minHeight: 52,
  },
  reasonPicked: { backgroundColor: Colors.secondaryContainer },
  reasonLabel: { ...Type.bodyMedium, color: Colors.onSurface, flex: 1 },
  reasonLabelPicked: { ...TypeEmphasized.bodyMedium, color: Colors.onSecondaryContainer },

  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, minHeight: 48,
  },
  checkLabel: { ...Type.bodyMedium, color: Colors.onSurface, flex: 1 },

  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  cancelBtn: {
    flex: 1, minHeight: 48, borderRadius: Shape.full,
    borderWidth: 1, borderColor: Colors.outline,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelText: { ...TypeEmphasized.labelLarge, color: Colors.onSurface },
  confirmBtn: {
    flex: 1, minHeight: 48, borderRadius: Shape.full,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmOff: { opacity: 0.38 },
  confirmText: { ...TypeEmphasized.labelLarge },
});
