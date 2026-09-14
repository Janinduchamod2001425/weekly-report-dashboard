import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional();

export const reportTaskSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Task name must contain at least 2 characters")
    .max(200, "Task name cannot exceed 200 characters"),

  projectId: z
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .optional(),

  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),

  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"]),

  plannedPercentage: z
    .number()
    .min(0, "Planned percentage cannot be below 0")
    .max(100, "Planned percentage cannot exceed 100"),

  actualPercentage: z
    .number()
    .min(0, "Actual percentage cannot be below 0")
    .max(100, "Actual percentage cannot exceed 100"),

  plannedMinutes: z
    .number()
    .int("Planned time must be a whole number")
    .min(0, "Planned time cannot be negative"),

  actualMinutes: z
    .number()
    .int("Actual time must be a whole number")
    .min(0, "Actual time cannot be negative"),

  deliverable: optionalText,
});

export const nextWeekTaskSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Task name must contain at least 2 characters")
    .max(200, "Task name cannot exceed 200 characters"),

  description: optionalText,

  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export const blockerSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Blocker title must contain at least 2 characters")
    .max(200, "Blocker title cannot exceed 200 characters"),

  description: optionalText,

  isKeyIssue: z.boolean(),

  isResolved: z.boolean(),
});

export const achievementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Achievement title must contain at least 2 characters")
    .max(200, "Achievement title cannot exceed 200 characters"),

  description: optionalText,

  isKeyAchievement: z.boolean(),
});

export const timeEntrySchema = z.object({
  taskType: z.enum([
    "DEVELOPMENT",
    "MEETING",
    "RESEARCH",
    "TESTING",
    "DOCUMENTATION",
    "DESIGN",
    "SUPPORT",
    "OTHER",
  ]),

  minutes: z
    .number()
    .int("Time must be entered as a whole number")
    .min(1, "Time must be at least 1 minute")
    .max(10080, "Time cannot exceed one week"),
});

export const reportLinkSchema = z.object({
  label: z
    .string()
    .trim()
    .min(2, "Link label must contain at least 2 characters")
    .max(100, "Link label cannot exceed 100 characters"),

  url: z
    .string()
    .trim()
    .url("Enter a valid URL, including http:// or https://"),
});

export const reportFormSchema = z
  .object({
    projectId: z.string().trim().min(1, "Select a project"),

    weekStart: z.string().min(1, "Select the week start date"),

    weekEnd: z.string().min(1, "Select the week end date"),

    notes: optionalText,

    tasks: z.array(reportTaskSchema).min(1, "Add at least one completed task"),

    nextWeekTasks: z
      .array(nextWeekTaskSchema)
      .min(1, "Add at least one next-week task"),

    blockers: z.array(blockerSchema),

    achievements: z
      .array(achievementSchema)
      .min(1, "Add at least one achievement"),

    timeEntries: z.array(timeEntrySchema),

    links: z.array(reportLinkSchema),
  })
  .superRefine((values, context) => {
    const weekStart = new Date(`${values.weekStart}T00:00:00`);
    const weekEnd = new Date(`${values.weekEnd}T00:00:00`);

    if (Number.isNaN(weekStart.getTime()) || Number.isNaN(weekEnd.getTime())) {
      return;
    }

    if (weekEnd < weekStart) {
      context.addIssue({
        code: "custom",
        path: ["weekEnd"],
        message: "Week end must be after the week start date",
      });
    }

    const totalDays =
      Math.round(
        (weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    if (totalDays > 7) {
      context.addIssue({
        code: "custom",
        path: ["weekEnd"],
        message: "The reporting period cannot exceed 7 days",
      });
    }
  });

export type ReportFormValues = z.infer<typeof reportFormSchema>;

export const defaultReportFormValues: ReportFormValues = {
  projectId: "",
  weekStart: "",
  weekEnd: "",
  notes: undefined,

  tasks: [
    {
      name: "",
      projectId: undefined,
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      plannedPercentage: 100,
      actualPercentage: 0,
      plannedMinutes: 0,
      actualMinutes: 0,
      deliverable: undefined,
    },
  ],

  nextWeekTasks: [
    {
      name: "",
      description: undefined,
      priority: "MEDIUM",
    },
  ],

  blockers: [],

  achievements: [
    {
      title: "",
      description: undefined,
      isKeyAchievement: false,
    },
  ],

  timeEntries: [],

  links: [],
};
