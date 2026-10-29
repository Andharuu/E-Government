import React from 'react';

export interface FontAwesomeProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  variant?: 'regular' | 'solid' | 'brands';
  className?: string;
  spin?: boolean;
}

// Icon dictionary mapping to Font Awesome 6/7 icons
const ICON_MAP: Record<string, { cls: string; variant?: 'regular' | 'solid' | 'brands' }> = {
  'triangle-exclamation': { cls: 'fa-triangle-exclamation', variant: 'solid' },
  'exclamation-triangle': { cls: 'fa-triangle-exclamation', variant: 'solid' },
  'circle-question': { cls: 'fa-circle-question', variant: 'solid' },
  question: { cls: 'fa-circle-question', variant: 'solid' },
  'user-plus': { cls: 'fa-user-plus', variant: 'solid' },
  'user-minus': { cls: 'fa-user-minus', variant: 'solid' },
  'user-slash': { cls: 'fa-user-slash', variant: 'solid' },
  'user-gear': { cls: 'fa-user-gear', variant: 'solid' },
  'user-shield': { cls: 'fa-user-shield', variant: 'solid' },
  'arrow-rotate-right': { cls: 'fa-rotate-right', variant: 'solid' },
  'arrows-rotate': { cls: 'fa-rotate', variant: 'solid' },
  rotate: { cls: 'fa-rotate', variant: 'solid' },
  paperclip: { cls: 'fa-paperclip', variant: 'solid' },
  link: { cls: 'fa-link', variant: 'solid' },
  tag: { cls: 'fa-tag', variant: 'solid' },
  tags: { cls: 'fa-tags', variant: 'solid' },
  // Navigation & Core Identity
  user: { cls: 'fa-user', variant: 'solid' },
  users: { cls: 'fa-users', variant: 'solid' },
  'users-rectangle': { cls: 'fa-users-rectangle', variant: 'solid' },
  sheet: { cls: 'fa-file-lines', variant: 'regular' },
  'id-card': { cls: 'fa-id-card', variant: 'solid' },
  'address-card': { cls: 'fa-address-card', variant: 'solid' },
  'circle-user': { cls: 'fa-circle-user', variant: 'solid' },
  'user-check': { cls: 'fa-user-check', variant: 'solid' },
  map: { cls: 'fa-map', variant: 'regular' },
  compass: { cls: 'fa-compass', variant: 'regular' },
  'map-pin': { cls: 'fa-location-dot', variant: 'solid' },
  envelope: { cls: 'fa-envelope', variant: 'solid' },
  mail: { cls: 'fa-envelope', variant: 'solid' },
  phone: { cls: 'fa-phone', variant: 'solid' },
  building: { cls: 'fa-building', variant: 'solid' },
  'building-columns': { cls: 'fa-building-columns', variant: 'solid' },
  landmark: { cls: 'fa-landmark', variant: 'solid' },
  heart: { cls: 'fa-heart', variant: 'solid' },
  'heart-pulse': { cls: 'fa-heart-pulse', variant: 'solid' },
  hospital: { cls: 'fa-hospital', variant: 'solid' },
  handshake: { cls: 'fa-handshake', variant: 'solid' },
  
  // Theme & Controls
  sun: { cls: 'fa-sun', variant: 'solid' },
  moon: { cls: 'fa-moon', variant: 'solid' },
  download: { cls: 'fa-download', variant: 'solid' },
  chrome: { cls: 'fa-chrome', variant: 'brands' },
  google: { cls: 'fa-google', variant: 'brands' },
  apple: { cls: 'fa-apple', variant: 'brands' },
  windows: { cls: 'fa-windows', variant: 'brands' },
  edge: { cls: 'fa-edge', variant: 'brands' },
  
  // Documents & Media
  file: { cls: 'fa-file', variant: 'solid' },
  'file-lines': { cls: 'fa-file-lines', variant: 'solid' },
  'file-text': { cls: 'fa-file-lines', variant: 'solid' },
  'file-check': { cls: 'fa-file-circle-check', variant: 'solid' },
  document: { cls: 'fa-file-lines', variant: 'solid' },
  'file-invoice-dollar': { cls: 'fa-file-invoice-dollar', variant: 'solid' },
  'file-contract': { cls: 'fa-file-contract', variant: 'solid' },
  stamp: { cls: 'fa-stamp', variant: 'solid' },
  calculator: { cls: 'fa-calculator', variant: 'solid' },
  bank: { cls: 'fa-building-columns', variant: 'solid' },
  'id-badge': { cls: 'fa-id-badge', variant: 'solid' },
  clipboard: { cls: 'fa-clipboard', variant: 'solid' },
  'clipboard-check': { cls: 'fa-clipboard-check', variant: 'solid' },
  'clipboard-list': { cls: 'fa-clipboard-list', variant: 'solid' },
  folder: { cls: 'fa-folder', variant: 'solid' },
  'folder-open': { cls: 'fa-folder-open', variant: 'solid' },
  'folder-plus': { cls: 'fa-folder-plus', variant: 'solid' },
  image: { cls: 'fa-image', variant: 'solid' },
  images: { cls: 'fa-images', variant: 'solid' },
  camera: { cls: 'fa-camera', variant: 'solid' },
  eye: { cls: 'fa-eye', variant: 'solid' },
  'eye-slash': { cls: 'fa-eye-slash', variant: 'solid' },
  'eye-crossed': { cls: 'fa-eye-slash', variant: 'solid' },
  'eye-off': { cls: 'fa-eye-slash', variant: 'solid' },

  // Actions & Buttons
  copy: { cls: 'fa-copy', variant: 'solid' },
  edit: { cls: 'fa-pen-to-square', variant: 'solid' },
  'edit-3': { cls: 'fa-pen-to-square', variant: 'solid' },
  'pen-to-square': { cls: 'fa-pen-to-square', variant: 'solid' },
  trash: { cls: 'fa-trash-can', variant: 'solid' },
  'trash-2': { cls: 'fa-trash-can', variant: 'solid' },
  'trash-can': { cls: 'fa-trash-can', variant: 'solid' },
  eraser: { cls: 'fa-eraser', variant: 'solid' },
  check: { cls: 'fa-circle-check', variant: 'solid' },
  'check-circle': { cls: 'fa-circle-check', variant: 'solid' },
  'check-circle-2': { cls: 'fa-circle-check', variant: 'solid' },
  'check-pure': { cls: 'fa-check', variant: 'solid' },
  'circle-check': { cls: 'fa-circle-check', variant: 'solid' },
  cross: { cls: 'fa-circle-xmark', variant: 'solid' },
  'cross-small': { cls: 'fa-xmark', variant: 'solid' },
  x: { cls: 'fa-xmark', variant: 'solid' },
  xmark: { cls: 'fa-xmark', variant: 'solid' },
  'circle-xmark': { cls: 'fa-circle-xmark', variant: 'solid' },
  info: { cls: 'fa-circle-info', variant: 'solid' },
  'info-circle': { cls: 'fa-circle-info', variant: 'solid' },
  'circle-info': { cls: 'fa-circle-info', variant: 'solid' },
  'alert-circle': { cls: 'fa-circle-exclamation', variant: 'solid' },
  clock: { cls: 'fa-clock', variant: 'solid' },
  'time-past': { cls: 'fa-clock', variant: 'solid' },
  calendar: { cls: 'fa-calendar-days', variant: 'solid' },
  'calendar-days': { cls: 'fa-calendar-days', variant: 'solid' },
  bell: { cls: 'fa-bell', variant: 'solid' },
  bullseye: { cls: 'fa-bullseye', variant: 'solid' },
  shield: { cls: 'fa-shield-halved', variant: 'solid' },
  'shield-check': { cls: 'fa-shield-halved', variant: 'solid' },
  'shield-halved': { cls: 'fa-shield-halved', variant: 'solid' },
  'shield-exclamation': { cls: 'fa-shield-halved', variant: 'solid' },
  'shield-virus': { cls: 'fa-shield-virus', variant: 'solid' },
  bookmark: { cls: 'fa-bookmark', variant: 'solid' },
  disk: { cls: 'fa-floppy-disk', variant: 'solid' },
  save: { cls: 'fa-floppy-disk', variant: 'solid' },
  'floppy-disk': { cls: 'fa-floppy-disk', variant: 'solid' },
  newspaper: { cls: 'fa-newspaper', variant: 'solid' },
  'chart-bar': { cls: 'fa-chart-bar', variant: 'solid' },
  'chart-pie': { cls: 'fa-chart-pie', variant: 'solid' },
  'chart-line': { cls: 'fa-chart-line', variant: 'solid' },
  'chart-column': { cls: 'fa-chart-column', variant: 'solid' },
  'chart-area': { cls: 'fa-chart-area', variant: 'solid' },
  apps: { cls: 'fa-table-cells-large', variant: 'solid' },
  'credit-card': { cls: 'fa-credit-card', variant: 'solid' },
  star: { cls: 'fa-star', variant: 'solid' },
  sparkles: { cls: 'fa-star', variant: 'solid' },
  share: { cls: 'fa-paper-plane', variant: 'solid' },
  'paper-plane': { cls: 'fa-paper-plane', variant: 'solid' },
  comment: { cls: 'fa-comment-dots', variant: 'solid' },
  'comment-dots': { cls: 'fa-comment-dots', variant: 'solid' },
  comments: { cls: 'fa-comments', variant: 'solid' },
  'layer-group': { cls: 'fa-layer-group', variant: 'solid' },
  bullhorn: { cls: 'fa-bullhorn', variant: 'solid' },
  'circle-dot': { cls: 'fa-circle-dot', variant: 'solid' },
  'square-check': { cls: 'fa-square-check', variant: 'solid' },
  lightbulb: { cls: 'fa-lightbulb', variant: 'solid' },
  gem: { cls: 'fa-gem', variant: 'solid' },
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
  'magnifying-glass': { cls: 'fa-magnifying-glass', variant: 'solid' },
  'arrow-right': { cls: 'fa-arrow-right', variant: 'solid' },
  'arrow-left': { cls: 'fa-arrow-left', variant: 'solid' },
  'chevron-right': { cls: 'fa-chevron-right', variant: 'solid' },
  'caret-right': { cls: 'fa-caret-right', variant: 'solid' },
  'caret-left': { cls: 'fa-caret-left', variant: 'solid' },
  'caret-down': { cls: 'fa-caret-down', variant: 'solid' },
  'caret-up': { cls: 'fa-caret-up', variant: 'solid' },
  play: { cls: 'fa-play', variant: 'solid' },
  'angle-small-right': { cls: 'fa-chevron-right', variant: 'solid' },
  'chevron-left': { cls: 'fa-chevron-left', variant: 'solid' },
  'chevron-down': { cls: 'fa-chevron-down', variant: 'solid' },
  'chevron-up': { cls: 'fa-chevron-up', variant: 'solid' },
  'sign-out-alt': { cls: 'fa-arrow-right-from-bracket', variant: 'solid' },
  'sign-out': { cls: 'fa-arrow-right-from-bracket', variant: 'solid' },
  logout: { cls: 'fa-arrow-right-from-bracket', variant: 'solid' },
  'right-from-bracket': { cls: 'fa-arrow-right-from-bracket', variant: 'solid' },
  'arrow-right-from-bracket': { cls: 'fa-arrow-right-from-bracket', variant: 'solid' },
  'sign-in-alt': { cls: 'fa-arrow-right-to-bracket', variant: 'solid' },
  login: { cls: 'fa-arrow-right-to-bracket', variant: 'solid' },
  'right-to-bracket': { cls: 'fa-arrow-right-to-bracket', variant: 'solid' },
  'arrow-right-to-bracket': { cls: 'fa-arrow-right-to-bracket', variant: 'solid' },
  'menu-burger': { cls: 'fa-bars', variant: 'solid' },
  bars: { cls: 'fa-bars', variant: 'solid' },
  inbox: { cls: 'fa-inbox', variant: 'solid' },
  globe: { cls: 'fa-globe', variant: 'solid' },
  upload: { cls: 'fa-upload', variant: 'solid' },
  'graduation-cap': { cls: 'fa-graduation-cap', variant: 'solid' },
  wallet: { cls: 'fa-wallet', variant: 'solid' },
  'hand-holding-heart': { cls: 'fa-hand-holding-heart', variant: 'solid' },
  book: { cls: 'fa-book', variant: 'solid' },
  'arrow-up-right-from-square': { cls: 'fa-arrow-up-right-from-square', variant: 'solid' },
  'file-alt': { cls: 'fa-file-lines', variant: 'solid' },
  briefcase: { cls: 'fa-briefcase', variant: 'solid' },
  bolt: { cls: 'fa-bolt', variant: 'solid' },
  undo: { cls: 'fa-rotate-left', variant: 'solid' },
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

  // Fallback aman ke 'solid' jika tidak terpetakan (karena semua free icons pasti ada di solid)
  const finalVariant = variant
    ? variant
    : mapped?.variant
    ? mapped.variant
    : name.startsWith('brand-') || name.startsWith('fab-')
    ? 'brands'
    : 'solid';

  const prefix = finalVariant === 'solid' ? 'fa-solid' : finalVariant === 'brands' ? 'fa-brands' : 'fa-regular';
  const spinClass = spin ? 'fa-spin' : '';

  return (
    <i
      className={`${prefix} ${finalClass} ${spinClass} ${className} inline-flex items-center justify-center leading-none transition-transform duration-300 ease-out will-change-transform`}
      aria-hidden="true"
      {...props}
    />
  );
};

export const FaIcon = FontAwesome;
