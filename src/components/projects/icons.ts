import {
  Bug,
  Clock,
  Cpu,
  FileSearch,
  FileText,
  Gauge,
  KeyRound,
  Layers,
  LayoutGrid,
  Lock,
  Network,
  Repeat2,
  Route,
  ScanSearch,
  ShieldAlert,
  Target,
  Workflow,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { CategoryId, FindingIcon, StageId } from '@/data/projects'

export const CATEGORY_ICON: Record<CategoryId | 'all', LucideIcon> = {
  all: LayoutGrid,
  api: Workflow,
  binary: Cpu,
  format: FileText,
  reimpl: Layers,
  tooling: Wrench,
}

export const STAGE_ICON: Record<StageId, LucideIcon> = {
  static: ScanSearch,
  dynamic: Bug,
  behavior: Route,
  protocol: Network,
  reimpl: Repeat2,
}

export const FINDING_ICON: Record<FindingIcon, LucideIcon> = {
  key: KeyRound,
  clock: Clock,
  network: Network,
  shield: ShieldAlert,
  bug: Bug,
  cpu: Cpu,
  lock: Lock,
  file: FileSearch,
  zap: Zap,
  target: Target,
  layers: Layers,
  gauge: Gauge,
}
