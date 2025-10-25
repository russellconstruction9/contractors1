import { Building2Icon, ClipboardCheckIcon, ClockIcon, LayoutDashboardIcon, ListChecksIcon, UsersIcon, PackageIcon, CalendarIcon, MapIcon, FileTextIcon } from './icons/Icons';

export const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
  { path: '/projects', label: 'Projects', icon: Building2Icon },
  { path: '/tasks', label: 'Tasks', icon: ListChecksIcon },
  { path: '/schedule', label: 'Schedule', icon: CalendarIcon },
  { path: '/map', label: 'Map View', icon: MapIcon },
  { path: '/team', label: 'Team', icon: UsersIcon },
  { path: '/time-tracking', label: 'Time Tracking', icon: ClockIcon },
  { path: '/punch-lists', label: 'Punch Lists', icon: ClipboardCheckIcon },
  { path: '/inventory', label: 'Inventory', icon: PackageIcon },
  { path: '/invoicing', label: 'Invoicing', icon: FileTextIcon },
];
