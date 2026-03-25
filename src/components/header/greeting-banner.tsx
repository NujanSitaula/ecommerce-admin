"use client";

import {
  Sunrise,
  Sun,
  CloudSun,
  Sunset,
  Moon,
  type LucideIcon,
} from "lucide-react";

type TimeSlot = "early" | "morning" | "afternoon" | "evening" | "night";

interface GreetingSet {
  icon: LucideIcon;
  greetings: string[];
}

const GREETINGS: Record<TimeSlot, GreetingSet> = {
  early: {
    icon: Sunrise,
    greetings: [
      "Rise and shine!",
      "Early bird gets the worm.",
      "Fresh start energy.",
      "New day, new possibilities.",
      "You're up before the sun.",
      "Quiet hours, big ideas.",
      "Morning person mode activated.",
      "The early hours are yours.",
      "First light, first win.",
      "Stealth productivity hours.",
    ],
  },
  morning: {
    icon: Sun,
    greetings: [
      "Good morning!",
      "How's your day shaping up?",
      "Let's make today count.",
      "Ready to crush it?",
      "Fresh coffee, fresh ideas.",
      "Good morning — make it great!",
      "New day, new wins.",
      "How's the morning treating you?",
      "Let's get things done.",
      "Morning momentum starts here.",
      "Hello, sunshine!",
      "Ready when you are.",
    ],
  },
  afternoon: {
    icon: CloudSun,
    greetings: [
      "Good afternoon!",
      "How's the afternoon going?",
      "Power through.",
      "Afternoon flow activated.",
      "Halfway there — keep going!",
      "How's your day going?",
      "Steady progress.",
      "Midday momentum.",
      "Afternoon energy check-in.",
      "Still crushing it?",
      "Good afternoon — you've got this!",
      "Afternoon stretch?",
    ],
  },
  evening: {
    icon: Sunset,
    greetings: [
      "Good evening!",
      "Winding down strong.",
      "Almost there.",
      "Evening productivity mode.",
      "How's the evening going?",
      "Finishing strong.",
      "Golden hour vibes.",
      "Evening check-in.",
      "Wrapping up nicely?",
      "Good evening — last stretch!",
      "Sunset energy.",
      "Evening momentum.",
    ],
  },
  night: {
    icon: Moon,
    greetings: [
      "Burning the midnight oil?",
      "Late-night productivity mode.",
      "Night owl hours.",
      "Still at it — respect.",
      "Quiet night, focused work.",
      "Late but productive.",
      "Night shift activated.",
      "The night is yours.",
      "Powering through.",
      "Moonlit productivity.",
    ],
  },
};

function getTimeSlot(hour: number): TimeSlot {
  if (hour >= 0 && hour < 6) return "early";
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getGreeting(timeSlot: TimeSlot): { text: string; icon: LucideIcon } {
  const set = GREETINGS[timeSlot];
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  const hour = now.getHours();
  const seed = dayOfYear * 24 + hour;
  const index = seed % set.greetings.length;
  const text = set.greetings[index];
  return { text, icon: set.icon };
}

function getFirstName(fullName: string | undefined): string | null {
  if (!fullName?.trim()) return null;
  const first = fullName.trim().split(/\s+/)[0];
  return first || null;
}

interface GreetingBannerProps {
  userName?: string;
}

export function GreetingBanner({ userName }: GreetingBannerProps) {
  const now = new Date();
  const timeSlot = getTimeSlot(now.getHours());
  const { text, icon: Icon } = getGreeting(timeSlot);
  const firstName = getFirstName(userName);

  const displayText = firstName
    ? `${text.replace(/[.!]$/, "").trim()}, ${firstName}!`
    : text;

  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-sm text-muted-foreground truncate max-w-[240px]">
        {displayText}
      </span>
    </div>
  );
}
