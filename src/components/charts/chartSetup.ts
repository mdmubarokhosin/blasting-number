import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

export const CHART_COLORS = {
  accent: "oklch(0.62 0.195 253.83)",
  accentFill: "oklch(0.62 0.195 253.83 / 0.15)",
  success: "oklch(0.7329 0.1935 150.81)",
  warning: "oklch(0.7819 0.1585 72.33)",
  danger: "oklch(0.6532 0.2328 25.74)",
  muted: "oklch(0.5517 0.0138 285.94)",
  grid: "oklch(0.55 0.014 286 / 0.16)",
};

function cssToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Resolved at chart render time so light/dark themes stay legible. */
export function chartTextColor(): string {
  return cssToken("--muted", CHART_COLORS.muted);
}

function chartGridColor(): string {
  return cssToken("--border", CHART_COLORS.grid);
}

export function barOptions(stacked = false): ChartOptions<"bar"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    color: chartTextColor(),
    scales: {
      x: {
        stacked,
        grid: { display: false },
        ticks: { maxRotation: 0, autoSkip: true, color: chartTextColor() },
      },
      y: {
        stacked,
        beginAtZero: true,
        grid: { color: chartGridColor() },
        ticks: { precision: 0, color: chartTextColor() },
      },
    },
  };
}

export function lineOptions(): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    color: chartTextColor(),
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxRotation: 0, autoSkip: true, color: chartTextColor() },
      },
      y: {
        beginAtZero: true,
        grid: { color: chartGridColor() },
        ticks: { precision: 0, color: chartTextColor() },
      },
    },
    elements: { line: { tension: 0.35 }, point: { radius: 2 } },
  };
}

export function doughnutOptions(): ChartOptions<"doughnut"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 12, padding: 12, color: chartTextColor() },
      },
    },
    cutout: "62%",
  };
}

export { ChartJS };
