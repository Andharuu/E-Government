import React from 'react';

export interface FontAwesomeProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  variant?: 'regular' | 'solid' | 'brands';
  className?: string;
  spin?: boolean;
}

// Icon dictionary mapping to Font Awesome 6 icons
// Default & prioritized style is Classic Regular (fa-regular)
const ICON_MAP: Record<string, { cls: string; variant?: 'regular' | 'solid' | 'brands' }> = {
  // Navigation & Core Identity
  user: { cls: 'fa-user', variant: 'regular' },
  'id-card': { cls: 'fa-id-card', variant: 'regular' },
  'address-card': { cls: 'fa-address-card', variant: 'regular' },
  'circle-user': { cls: 'fa-circle-user', variant: 'regular' },
  map: { cls: 'fa-map', variant: 'regular' },
  compass: { cls: 'fa-compass', variant: 'regular' },
  'map-pin': { cls: 'fa-location-dot', variant: 'solid' },
  envelope: { cls: 'fa-envelope', variant: 'regular' },
  mail: { cls: 'fa-envelope', variant: 'regular' },
  phone: { cls: 'fa-phone', variant: 'solid' },
  building: { cls: 'fa-building', variant: 'regular' },
  'building-columns': { cls: 'fa-building-columns', variant: 'solid' },
  landmark: { cls: 'fa-landmark', variant: 'solid' },
  heart: { cls: 'fa-heart', variant: 'regular' },
  'heart-pulse': { cls: 'fa-heart-pulse', variant: 'solid' },
  hospital: { cls: 'fa-hospital', variant: 'regular' },
  handshake: { cls: 'fa-handshake', variant: 'regular' },
  
  // Documents & Media
  file: { cls: 'fa-file', variant: 'regular' },
  'file-lines': { cls: 'fa-file-lines', variant: 'regular' },
  'file-text': { cls: 'fa-file-lines', variant: 'regular' },
  'file-check': { cls: 'fa-file-lines', variant: 'regular' },
  document: { cls: 'fa-file-lines', variant: 'regular' },
  'file-invoice-dollar': { cls: 'fa-file-invoice-dollar', variant: 'solid' },
  calculator: { cls: 'fa-calculator', variant: 'solid' },
  bank: { cls: 'fa-building-columns', variant: 'solid' },
  'id-badge': { cls: 'fa-id-badge', variant: 'regular' },
  clipboard: { cls: 'fa-clipboard', variant: 'regular' },
  'clipboard-check': { cls: 'fa-clipboard-check', variant: 'solid' },
  'clipboard-list': { cls: 'fa-clipboard-list', variant: 'solid' },
  folder: { cls: 'fa-folder', variant: 'regular' },
  'folder-open': { cls: 'fa-folder-open', variant: 'regular' },
  'folder-plus': { cls: 'fa-folder-plus', variant: 'solid' },
  image: { cls: 'fa-image', variant: 'regular' },
  images: { cls: 'fa-images', variant: 'regular' },
  camera: { cls: 'fa-camera', variant: 'solid' },
  eye: { cls: 'fa-eye', variant: 'regular' },
  'eye-slash': { cls: 'fa-eye-slash', variant: 'regular' },
  'eye-crossed': { cls: 'fa-eye-slash', variant: 'regular' },
  'eye-off': { cls: 'fa-eye-slash', variant: 'regular' },

  // Actions & Buttons
  copy: { cls: 'fa-copy', variant: 'regular' },
  edit: { cls: 'fa-pen-to-square', variant: 'regular' },
  'edit-3': { cls: 'fa-pen-to-square', variant: 'regular' },
  'pen-to-square': { cls: 'fa-pen-to-square', variant: 'regular' },
  trash: { cls: 'fa-trash-can', variant: 'regular' },
  'trash-2': { cls: 'fa-trash-can', variant: 'regular' },
  'trash-can': { cls: 'fa-trash-can', variant: 'regular' },
  check: { cls: 'fa-circle-check', variant: 'regular' },
  'check-circle': { cls: 'fa-circle-check', variant: 'regular' },
  'check-circle-2': { cls: 'fa-circle-check', variant: 'regular' },
  'check-pure': { cls: 'fa-check', variant: 'solid' },
  'circle-check': { cls: 'fa-circle-check', variant: 'regular' },
  cross: { cls: 'fa-circle-xmark', variant: 'regular' },
  'cross-small': { cls: 'fa-xmark', variant: 'solid' },
  x: { cls: 'fa-xmark', variant: 'solid' },
  xmark: { cls: 'fa-circle-xmark', variant: 'regular' },
  info: { cls: 'fa-circle-question', variant: 'regular' },
  'info-circle': { cls: 'fa-circle-question', variant: 'regular' },
  'alert-circle': { cls: 'fa-circle-exclamation', variant: 'solid' },
  clock: { cls: 'fa-clock', variant: 'regular' },
  'time-past': { cls: 'fa-clock', variant: 'regular' },
  calendar: { cls: 'fa-calendar-days', variant: 'regular' },
  'calendar-days': { cls: 'fa-calendar-days', variant: 'regular' },
  bell: { cls: 'fa-bell', variant: 'regular' },
  bullseye: { cls: 'fa-bullseye', variant: 'solid' },
  shield: { cls: 'fa-shield-halved', variant: 'solid' },
  bookmark: { cls: 'fa-bookmark', variant: 'regular' },
  disk: { cls: 'fa-floppy-disk', variant: 'regular' },
  save: { cls: 'fa-floppy-disk', variant: 'regular' },
  'floppy-disk': { cls: 'fa-floppy-disk', variant: 'regular' },
  newspaper: { cls: 'fa-newspaper', variant: 'regular' },
  'chart-bar': { cls: 'fa-chart-bar', variant: 'solid' },
  'chart-pie': { cls: 'fa-chart-pie', variant: 'solid' },
  'chart-line': { cls: 'fa-chart-line', variant: 'solid' },
  'chart-column': { cls: 'fa-chart-column', variant: 'solid' },
  'chart-area': { cls: 'fa-chart-area', variant: 'solid' },
  apps: { cls: 'fa-chart-bar', variant: 'solid' },
  'credit-card': { cls: 'fa-credit-card', variant: 'regular' },
  star: { cls: 'fa-star', variant: 'regular' },
  sparkles: { cls: 'fa-star', variant: 'regular' },
  share: { cls: 'fa-paper-plane', variant: 'regular' },
  'paper-plane': { cls: 'fa-paper-plane', variant: 'regular' },
  comment: { cls: 'fa-comment-dots', variant: 'regular' },
  'comment-dots': { cls: 'fa-comment-dots', variant: 'regular' },
  'circle-dot': { cls: 'fa-circle-dot', variant: 'regular' },
  'square-check': { cls: 'fa-square-check', variant: 'regular' },
  lightbulb: { cls: 'fa-lightbulb', variant: 'regular' },
  gem: { cls: 'fa-gem', variant: 'regular' },
  settings: { cls: 'fa-gear', variant: 'solid' },
  gear: { cls: 'fa-gear', variant: 'solid' },
  cog: { cls: 'fa-gear', variant: 'solid' },
  lock: { cls: 'fa-lock', variant: 'solid' },
  key: { cls: 'fa-key', variant: 'solid' },
  'rotate-right': { cls: 'fa-rotate-right', variant: 'solid' },
  refresh: { cls: 'fa-rotate-right', variant: 'solid' },
  sync: { cls: 'fa-rotate-right', variant: 'solid' },
  spinner: { cls: 'fa-circle-notch', variant: 'solid' },
  loader: { cls: 'fa-circle-notch', variant: 'solid' },
  loader2: { cls: 'fa-circle-notch', variant: 'solid' },
  plus: { cls: 'fa-plus', variant: 'solid' },
  search: { cls: 'fa-magnifying-glass', variant: 'solid' },
  'arrow-right': { cls: 'fa-arrow-right', variant: 'solid' },
  'arrow-left': { cls: 'fa-arrow-left', variant: 'solid' },
  'chevron-right': { cls: 'fa-chevron-right', variant: 'solid' },
  'angle-small-right': { cls: 'fa-chevron-right', variant: 'solid' },
  'chevron-left': { cls: 'fa-chevron-left', variant: 'solid' },
  'chevron-down': { cls: 'fa-chevron-down', variant: 'solid' },
  'chevron-up': { cls: 'fa-chevron-up', variant: 'solid' },
  'sign-out-alt': { cls: 'fa-arrow-right-from-bracket', variant: 'solid' },
  'sign-out': { cls: 'fa-arrow-right-from-bracket', variant: 'solid' },
  logout: { cls: 'fa-arrow-right-from-bracket', variant: 'solid' },
  'sign-in-alt': { cls: 'fa-arrow-right-to-bracket', variant: 'solid' },
  login: { cls: 'fa-arrow-right-to-bracket', variant: 'solid' },
  'menu-burger': { cls: 'fa-bars', variant: 'solid' },
  bars: { cls: 'fa-bars', variant: 'solid' },
  inbox: { cls: 'fa-inbox', variant: 'solid' },
  globe: { cls: 'fa-globe', variant: 'solid' },
  upload: { cls: 'fa-upload', variant: 'solid' },
  'graduation-cap': { cls: 'fa-graduation-cap', variant: 'solid' },
  briefcase: { cls: 'fa-briefcase', variant: 'solid' },
  bolt: { cls: 'fa-bolt', variant: 'solid' },
  undo: { cls: 'fa-rotate-left', variant: 'solid' },
  'shield-check': { cls: 'fa-shield-halved', variant: 'solid' },
  'align-left': { cls: 'fa-align-left', variant: 'solid' },
  filter: { cls: 'fa-filter', variant: 'solid' },
  list: { cls: 'fa-list', variant: 'solid' },
  'list-ul': { cls: 'fa-list-ul', variant: 'solid' },
  grid: { cls: 'fa-table-cells-large', variant: 'solid' },
  'table-cells': { cls: 'fa-table-cells-large', variant: 'solid' },
  sort: { cls: 'fa-sort', variant: 'solid' },
};

export const FontAwesome: React.FC<FontAwesomeProps> = ({
  name,
  variant,
  className = '',
  spin = false,
  ...props
}) => {
  const mapped = ICON_MAP[name];
  const finalClass = mapped?.cls || (name.startsWith('fa-') ? name : `fa-${name}`);

  // Jika icon hanya tersedia di solid (mapped.variant === 'solid'), paksa solid agar tidak broken glyph [?]
  const finalVariant = mapped?.variant === 'solid'
    ? 'solid'
    : (variant || mapped?.variant || 'regular');
  
  const prefix = finalVariant === 'solid' ? 'fa-solid' : finalVariant === 'brands' ? 'fa-brands' : 'fa-regular';
  const spinClass = spin ? 'fa-spin' : '';

  return (
    <i
      className={`${prefix} ${finalClass} ${spinClass} ${className} inline-flex items-center justify-center leading-none`}
      aria-hidden="true"
      {...props}
    />
  );
};

export const FaIcon = FontAwesome;
