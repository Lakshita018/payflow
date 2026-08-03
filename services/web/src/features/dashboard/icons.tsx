import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function LogoMark() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 shadow-[0_18px_36px_rgba(109,40,217,0.28)]">
      <span className="text-lg font-semibold text-white">P</span>
    </div>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16.2 16.2 20 20" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" {...props}>
      <path d="M6 8.5a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5A1.5 1.5 0 0 1 12 5.5v5A1.5 1.5 0 0 1 10.5 12h-5A1.5 1.5 0 0 1 4 10.5Z" />
      <path d="M12 13.5A1.5 1.5 0 0 1 13.5 12h5A1.5 1.5 0 0 1 20 13.5v5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 12 18.5Z" />
      <path d="M12 5.5A1.5 1.5 0 0 1 13.5 4h5A1.5 1.5 0 0 1 20 5.5v2A1.5 1.5 0 0 1 18.5 9h-5A1.5 1.5 0 0 1 12 7.5Z" />
      <path d="M4 16.5A1.5 1.5 0 0 1 5.5 15h5A1.5 1.5 0 0 1 12 16.5v2A1.5 1.5 0 0 1 10.5 20h-5A1.5 1.5 0 0 1 4 18.5Z" />
    </svg>
  );
}

export function TransactionsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M8 9h8M8 13h8M8 17h4" />
    </svg>
  );
}

export function SendMoneyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="M21 3 10 14" />
      <path d="m21 3-7 19-4-8-8-4 19-7Z" />
    </svg>
  );
}

export function ContactsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c1.1-3.1 3.7-5 5.5-5s4.4 1.9 5.5 5" />
      <path d="M15.5 7h5M15.5 11h5M15.5 15h5" />
    </svg>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20c1.6-3.6 4.9-5.5 6.5-5.5S16.9 16.4 18.5 20" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
      <path d="M19.4 13.5v-3l-2-1.1a7.7 7.7 0 0 0-.8-1.4l.7-2.3-2.1-2.1-2.3.7a7.7 7.7 0 0 0-1.4-.8L10.5 1.6h-3l-1.1 2a7.7 7.7 0 0 0-1.4.8l-2.3-.7-2.1 2.1.7 2.3a7.7 7.7 0 0 0-.8 1.4l-2 1.1v3l2 1.1a7.7 7.7 0 0 0 .8 1.4l-.7 2.3 2.1 2.1 2.3-.7c.4.3.9.6 1.4.8l1.1 2h3l1.1-2c.5-.2 1-.5 1.4-.8l2.3.7 2.1-2.1-.7-2.3c.3-.4.6-.9.8-1.4Z" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="M7 17 17 7" />
      <path d="M10 7h7v7" />
    </svg>
  );
}

export function ArrowDownLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="M17 7 7 17" />
      <path d="M14 17H7v-7" />
    </svg>
  );
}

export function RequestMoneyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Z" />
      <path d="M12 8v4l2 2" />
      <path d="M8 12h.01" />
      <path d="M16 12h.01" />
      <path d="M9.5 15.5a4 4 0 0 0 5 0" />
    </svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="M22 12h-6l-2 3H10l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </svg>
  );
}

export function OutboxIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="M12 3 19 6v6c0 5-3.4 8.5-7 10-3.6-1.5-7-5-7-10V6l7-3Z" />
      <path d="M9.5 12.2 11.4 14 15 10.2" />
    </svg>
  );
}