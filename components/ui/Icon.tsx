import React from 'react';
import {
  NavArrowLeft,
  NavArrowRight,
  NavArrowDown,
  NavArrowUp,
  Plus,
  PlusCircle,
  MinusCircle,
  Xmark,
  XmarkCircle,
  Check,
  CheckCircle,
  ArrowUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Home,
  HomeSimple,
  User,
  Settings,
  Search,
  List,
  Calendar,
  Clock,
  CreditCard,
  Wallet,
  Bank,
  DashFlag,
  FireFlame,
  Trophy,
  Trash,
  EditPencil,
  Download,
  CloudDownload,
  Refresh,
  Bell,
  HalfMoon,
  SunLight,
  Lock,
  HelpCircle,
  InfoCircle,
  WarningCircle,
  Rocket,
  GraphUp,
  Link,
  OpenNewWindow,
  Flash,
  Compass,
  LogOut,
  Wifi,
  MapPin,
  Square,
  CheckSquare,
  Circle,
  Star,
} from 'iconoir-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { SvgProps } from 'react-native-svg';

type IconoirComponent = React.ComponentType<SvgProps>;

const ICON_MAP: Record<string, IconoirComponent> = {
  'arrow-back': NavArrowLeft,
  'arrow-forward': NavArrowRight,
  'arrow-up': ArrowUp,
  'arrow-up-circle': ArrowUpCircle,
  'arrow-down-circle': ArrowDownCircle,
  'chevron-forward': NavArrowRight,
  'chevron-back': NavArrowLeft,
  'chevron-down': NavArrowDown,
  'chevron-up': NavArrowUp,
  'chevron-forward-circle': NavArrowRight,
  'add': Plus,
  'add-circle': PlusCircle,
  'add-circle-outline': PlusCircle,
  'remove-circle': MinusCircle,
  'close': Xmark,
  'close-circle': XmarkCircle,
  'close-circle-outline': XmarkCircle,
  'checkmark': Check,
  'checkmark-circle': CheckCircle,
  'checkbox': CheckSquare,
  'square-outline': Square,
  'ellipse-outline': Circle,
  'home': Home,
  'person': User,
  'settings-outline': Settings,
  'search': Search,
  'list': List,
  'calendar': Calendar,
  'calendar-outline': Calendar,
  'time': Clock,
  'card': CreditCard,
  'card-outline': CreditCard,
  'wallet': Wallet,
  'wallet-outline': Wallet,
  'cash': Wallet,
  'bank': Bank,
  'flag': DashFlag,
  'flag-outline': DashFlag,
  'flame': FireFlame,
  'trophy': Trophy,
  'trash-outline': Trash,
  'create-outline': EditPencil,
  'download': Download,
  'cloud-download': CloudDownload,
  'refresh': Refresh,
  'sync': Refresh,
  'notifications': Bell,
  'moon': HalfMoon,
  'sunny': SunLight,
  'lock-closed': Lock,
  'help-circle': HelpCircle,
  'information-circle-outline': InfoCircle,
  'alert-circle': WarningCircle,
  'alert-circle-outline': WarningCircle,
  'rocket': Rocket,
  'trending-up': GraphUp,
  'link': Link,
  'open-outline': OpenNewWindow,
  'flash': Flash,
  'compass': Compass,
  'exit': LogOut,
  'wifi': Wifi,
  'location': MapPin,
  'document-text': List,
  'receipt-outline': List,
  'pricetag': Star,
  'apps': HomeSimple,
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const FONT_ICON_MAP: Record<string, string> = {
  'backspace-outline': 'backspace-outline',
};

export function Icon({ name, size = 24, color = '#000', style }: IconProps) {
  const fontIconName = FONT_ICON_MAP[name];
  if (fontIconName) {
    return (
      <MaterialCommunityIcons
        name={fontIconName as any}
        size={size}
        color={color}
        style={style}
      />
    );
  }

  const Component = ICON_MAP[name];

  if (!Component) {
    if (__DEV__) {
      console.warn(`[Icon] No mapping for "${name}"`);
    }
    return null;
  }

  return <Component width={size} height={size} color={color} style={style} />;
}
