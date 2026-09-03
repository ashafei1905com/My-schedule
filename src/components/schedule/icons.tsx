import type { LucideIcon } from "lucide-react";
import {
  Apple,
  BookOpen,
  Briefcase,
  Code,
  Coffee,
  Dumbbell,
  HeartPulse,
  Inbox,
  Moon,
  MoonStar,
  Sunrise,
  Utensils,
  Waves,
} from "lucide-react";
import type { Category } from "@/lib/schedule/types";

const MAP: Record<Category, LucideIcon> = {
  prayer: Moon,
  food: Utensils,
  gym: Dumbbell,
  swim: Waves,
  recovery: HeartPulse,
  quran: BookOpen,
  prog: Code,
  sleep: MoonStar,
  free: Coffee,
  snack: Apple,
  sunrise: Sunrise,
  work: Briefcase,
  admin: Inbox,
};

export function CatIcon({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  const Icon = MAP[category] ?? Inbox;
  return <Icon className={className} strokeWidth={1.75} />;
}
