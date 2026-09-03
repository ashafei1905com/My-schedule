import {
  Apple,
  BookOpen,
  Briefcase,
  Coffee,
  Code2,
  Dumbbell,
  HeartPulse,
  Inbox,
  Moon,
  MoonStar,
  Sunrise,
  Utensils,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_ICON } from "@/features/schedule/models/category";
import type { TaskCategory } from "@/features/schedule/models/task";
import { cn } from "@/shared/lib/cn";

const ICONS: Record<string, LucideIcon> = {
  Moon,
  Utensils,
  Dumbbell,
  Waves,
  HeartPulse,
  BookOpen,
  Code2,
  MoonStar,
  Coffee,
  Apple,
  Sunrise,
  Briefcase,
  Inbox,
};

export function CategoryIcon({
  category,
  className,
}: {
  category: TaskCategory;
  className?: string;
}) {
  const Icon = ICONS[CATEGORY_ICON[category]] ?? Inbox;
  return <Icon className={cn("size-4", className)} strokeWidth={1.75} />;
}
