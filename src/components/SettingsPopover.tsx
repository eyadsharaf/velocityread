import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useReaderStore } from '../store/readerStore';

/**
 * Settings popover anchored above the controls pill. Open state lives in
 * Reader (it gates the controls auto-fade); this component just renders the
 * controls and handles Escape / outside-click dismissal.
 */

const segBtn =
  'h-8 px-3 rounded-full text-sm font-medium transition-colors select-none';

function SegButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`${segBtn} ${
        active ? 'bg-accent text-white' : 'text-text-secondary hover:text-text'
      }`}
    >
      {children}
    </button>
  );
}

function SegRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-text-muted text-sm select-none">{label}</span>
      <div className="flex items-center gap-0.5 rounded-full bg-surface border border-border p-0.5">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-text-muted text-sm select-none">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        className={`relative w-10 h-6 rounded-full border transition-colors select-none ${
          checked
            ? 'bg-accent border-accent'
            : 'bg-surface border-border hover:border-text-dim'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
            checked ? 'translate-x-4 bg-white' : 'bg-text-dim'
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPopover({ onClose }: { onClose: () => void }) {
  const settings = useReaderStore((s) => s.settings);
  const updateSettings = useReaderStore((s) => s.updateSettings);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Outside-click dismissal. Clicks on the gear (data-settings-toggle) are
  // skipped so the button's own toggle handles them instead of close+reopen.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      if (ref.current?.contains(target)) return;
      if (target.closest('[data-settings-toggle]')) return;
      onClose();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Settings"
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[280px] max-h-[60dvh] overflow-y-auto p-4 flex flex-col gap-4 rounded-lg bg-elevated border border-border shadow-[0_4px_16px_rgba(0,0,0,0.35)] min-[430px]:top-auto min-[430px]:bottom-full min-[430px]:mt-0 min-[430px]:mb-3"
    >
      <SegRow label="Theme">
        <SegButton
          active={settings.theme === 'dark'}
          label="Dark theme"
          onClick={() => updateSettings({ theme: 'dark' })}
        >
          Dark
        </SegButton>
        <SegButton
          active={settings.theme === 'light'}
          label="Light theme"
          onClick={() => updateSettings({ theme: 'light' })}
        >
          Light
        </SegButton>
      </SegRow>

      <SegRow label="Word size">
        <SegButton
          active={settings.rsvpScale === 0.85}
          label="Small word size"
          onClick={() => updateSettings({ rsvpScale: 0.85 })}
        >
          S
        </SegButton>
        <SegButton
          active={settings.rsvpScale === 1}
          label="Medium word size"
          onClick={() => updateSettings({ rsvpScale: 1 })}
        >
          M
        </SegButton>
        <SegButton
          active={settings.rsvpScale === 1.15}
          label="Large word size"
          onClick={() => updateSettings({ rsvpScale: 1.15 })}
        >
          L
        </SegButton>
        <SegButton
          active={settings.rsvpScale === 1.3}
          label="Extra large word size"
          onClick={() => updateSettings({ rsvpScale: 1.3 })}
        >
          XL
        </SegButton>
      </SegRow>

      <SegRow label="Text size">
        <SegButton
          active={settings.readerFont === 14}
          label="Small text size"
          onClick={() => updateSettings({ readerFont: 14 })}
        >
          S
        </SegButton>
        <SegButton
          active={settings.readerFont === 16}
          label="Medium text size"
          onClick={() => updateSettings({ readerFont: 16 })}
        >
          M
        </SegButton>
        <SegButton
          active={settings.readerFont === 18}
          label="Large text size"
          onClick={() => updateSettings({ readerFont: 18 })}
        >
          L
        </SegButton>
      </SegRow>

      <ToggleRow
        label="Focus mode"
        checked={settings.focusMode}
        onToggle={() => updateSettings({ focusMode: !settings.focusMode })}
      />

      <ToggleRow
        label="Pacing pauses"
        checked={settings.pacingPauses}
        onToggle={() => updateSettings({ pacingPauses: !settings.pacingPauses })}
      />
    </div>
  );
}
