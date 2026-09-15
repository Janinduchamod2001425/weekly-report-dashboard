import { z } from "zod";

export const userRoleSchema = z.enum(["TEAM_MEMBER", "MANAGER", "ADMIN"]);

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional();

const userFieldsSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name cannot exceed 50 characters"),

  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name cannot exceed 50 characters"),

  email: z.string().trim().email("Enter a valid email address"),

  jobTitle: optionalText,

  role: userRoleSchema,

  managerId: z
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .optional(),

  projectIds: z.array(z.string()),

  isActive: z.boolean(),
});

export const createUserSchema = userFieldsSchema
  .extend({
    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .max(72, "Password cannot exceed 72 characters"),

    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }

    if (values.role !== "TEAM_MEMBER" && values.managerId) {
      context.addIssue({
        code: "custom",
        path: ["managerId"],
        message: "Only team members can have a reporting manager",
      });
    }
  });

export const updateUserSchema = userFieldsSchema
  .extend({
    password: z
      .string()
      .max(72, "Password cannot exceed 72 characters")
      .refine((value) => value === "" || value.length >= 8, {
        message: "Password must contain at least 8 characters",
      }),

    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }

    if (values.role !== "TEAM_MEMBER" && values.managerId) {
      context.addIssue({
        code: "custom",
        path: ["managerId"],
        message: "Only team members can have a reporting manager",
      });
    }
  });

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export const defaultCreateUserValues: CreateUserFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  jobTitle: undefined,
  password: "",
  confirmPassword: "",
  role: "TEAM_MEMBER",
  managerId: undefined,
  projectIds: [],
  isActive: true,
};
