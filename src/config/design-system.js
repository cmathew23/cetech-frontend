/**
 * PEAKFLOW — structured design tokens (class strings + color reference).
 * Tailwind theme: tailwind.config.js. UI composes from these groups only.
 *
 * Spacing contract:
 * - form (space-y-4): field groups via FormSection / related stacks
 * - section (space-y-6): major blocks inside Card / page sections
 * - page (space-y-8): top-level page stacks
 */

const INPUT_ROOT =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-textPrimary caret-current placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary";

export const designSystem = {
  name: "PEAKFLOW",

  colors: {
    primary: "#F97316",
    primaryDark: "#C2410C",
    primaryLight: "#FFEDD5",
    bg: "#F7F4EE",
    card: "#FFFFFF",
    border: "#E5E7EB",
    textPrimary: "#111827",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    success: "#22C55E",
    successDark: "#15803D",
    successLight: "#DCFCE7",
    warning: "#F59E0B",
    danger: "#DC2626",
    sidebar: "#0B1F2A",
  },

  typography: {
    h1: "mb-4 text-2xl font-semibold tracking-tight text-textPrimary",
    h2: "mb-4 text-lg font-semibold text-textPrimary sm:text-xl lg:text-2xl",
    h3: "mb-4 text-lg font-semibold text-textPrimary",
    body: "text-base font-normal text-textPrimary",
    muted: "text-sm font-normal text-textSecondary",
  },

  spacing: {
    dense: "space-y-2",
    form: "space-y-4",
    section: "space-y-6",
    page: "space-y-8",
  },

  formField: {
    root: "flex flex-col gap-2",
    controlWithHelper: "flex flex-col gap-1",
    label: "text-sm font-medium text-textPrimary",
    requiredMark: "text-danger",
    error: "text-sm text-danger",
  },

  input: {
    root: INPUT_ROOT,
  },

  select: {
    root: `${INPUT_ROOT} cursor-pointer`,
  },

  layout: {
    page: "flex min-h-screen min-w-0 bg-bg",
    main: "min-w-0 flex-1 overflow-y-auto",

    /** Root app shell (marketing header + centered content). */
    rootBody: "min-h-screen font-sans text-textPrimary",
    outerShell: "min-h-screen bg-bg",
    centeredColumn:
      "mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-8",
    marketingHeader: "text-center",
    marketingTitle: "text-4xl font-bold tracking-tight text-textPrimary",
    marketingSubtitle: "mt-1 text-base text-textSecondary",
    mainSlot: "flex flex-1 flex-col items-center justify-center py-8",
    /** Shared athlete / coach / academy-admin dashboard sidebar (single spacing system). */
    sidebar: {
      root:
        "flex h-full w-full min-w-0 flex-col overflow-y-auto border-r border-border bg-sidebar px-3 py-5",
      brand: "mb-4 border-b border-white/10 pb-4",
      nav: "flex flex-col gap-2",
      link:
        "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium leading-snug text-gray-300 transition-all duration-200 hover:bg-primary/15 hover:text-white",
      linkActive: "bg-primary/90 font-semibold text-white shadow-sm",
      /** Logout sits after nav items; top rule separates it without pushing it to the viewport bottom. */
      logout:
        "mt-2 border-t border-white/10 pt-3 text-gray-300 hover:bg-primary/15 hover:text-white",
    },

    /** Login card: single column below lg, two columns at lg. Column gap is layout-only (no grid gap). */
    authSplit: {
      pageContainer: "mx-auto w-full max-w-[900px] px-3 sm:px-4 lg:px-6",
      grid: "grid grid-cols-1 gap-0 lg:grid-cols-2 lg:min-h-[280px]",
      loginColumn: "flex flex-col lg:border-r lg:border-border lg:pr-6",
      ctaColumn:
        "mt-6 flex min-h-[140px] flex-col items-center justify-center border-t border-border bg-primaryDark px-5 py-6 text-center text-white sm:min-h-[160px] sm:px-6 sm:py-6 lg:mt-0 lg:min-h-full lg:border-t-0 lg:px-8 lg:py-8",
      ctaTitle:
        "mb-0 text-lg font-semibold text-white sm:text-xl lg:text-2xl",
      ctaBody: "max-w-xs text-sm text-white/90 sm:text-base",
      cardPadding: "p-5 py-7 sm:p-6 lg:p-6",
    },

    registerForm: {
      actions: "flex justify-end pt-4",
    },
  },

  card: {
    root:
      "relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg",
    padding: {
      compact: "p-4",
      default: "p-4 md:p-5",
      spacious: "p-5 md:p-6",
    },
    header: {
      root: "mb-4 flex items-start justify-between gap-3",
      title: "text-base font-semibold text-textPrimary",
      subtitle: "mt-1 text-sm font-normal text-textSecondary",
    },
    accent: "absolute inset-x-0 top-0 h-0.5 bg-primary/70",
  },

  button: {
    base:
      "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    primary:
      "bg-primary text-white shadow-sm hover:bg-primaryDark hover:-translate-y-px focus:ring-primary/50",
    secondary:
      "border border-primary bg-transparent text-primary shadow-sm hover:bg-primary/10 hover:-translate-y-px focus:ring-primary/35",
    success:
      "bg-green-600 text-white shadow-sm hover:bg-green-700 hover:-translate-y-px focus:ring-green-500",
    neutral:
      "border border-border bg-card text-textPrimary shadow-sm hover:bg-bg hover:-translate-y-px focus:ring-slate-300",
    danger: "bg-danger text-card shadow-sm hover:bg-danger/90 hover:-translate-y-px",
    destructive:
      "bg-danger text-card shadow-sm hover:bg-danger/90 hover:-translate-y-px",
  },

  badge: {
    base:
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide",
    success: "bg-successLight/80 text-successDark",
    warning: "bg-warning/20 text-[#9A6700]",
    neutral: "bg-zinc-100/90 text-zinc-700",
    error: "bg-danger/15 text-danger",
    accent: "bg-primaryLight text-primaryDark",
    danger: "bg-danger/15 text-danger",
  },

  modal: {
    backdrop:
      "fixed inset-0 z-[9999] flex items-center justify-center bg-textPrimary/60 p-4 backdrop-blur-sm",
    panel:
      "relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-md",
  },

  table: {
    container:
      "overflow-x-auto rounded-2xl border border-border bg-card shadow-sm",
    root: "w-full min-w-full border-separate border-spacing-0 text-left text-sm",
    row: {
      head: "bg-gray-100",
      body:
        "transition-colors duration-150 odd:bg-card even:bg-card hover:bg-gray-50 [&:last-child_td]:border-b-0",
    },
    cell: {
      head: "border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold text-textPrimary",
      body: "border-b border-gray-200 px-4 py-4 align-middle text-textSecondary",
    },
  },

  alert: {
    base: "rounded-lg border px-4 py-3 text-sm",
    success: "border-success/30 bg-successLight text-successDark",
    warning: "border-warning/30 bg-warning/15 text-warning",
    danger: "border-danger/30 bg-danger/15 text-danger",
  },
};
