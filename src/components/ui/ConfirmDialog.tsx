import type { ReactElement } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { Button } from '@components/ui/Button';
import { radius, spacing } from '@theme/spacing';
import { palette } from '@theme/colors';
import { useTheme } from '@theme/ThemeProvider';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Eliminar',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): ReactElement {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: `${palette.tinta}66` }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[theme.typography.h3, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{message}</Text>
          <View style={styles.actions}>
            <Button label="Cancelar" variant="text" onPress={onCancel} disabled={busy} />
            <Button label={confirmLabel} variant="destructive" onPress={onConfirm} loading={busy} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radius.modal,
    padding: spacing.xl,
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
