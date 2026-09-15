"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRoleHomePath, useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must contain at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginForm) {
    try {
      const user = await login(values);

      toast.success("Welcome back", {
        description: `Signed in as ${user.firstName} ${user.lastName}`,
      });

      router.replace(getRoleHomePath(user));
    } catch (error) {
      toast.error("Login failed", {
        description:
          error instanceof ApiError
            ? error.message
            : "Unable to connect to the server",
      });
    }
  }

  function useDemoAccount(email: string, password: string) {
    setValue("email", email, {
      shouldValidate: true,
    });

    setValue("password", password, {
      shouldValidate: true,
    });
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-3xl tracking-tight">Welcome back</CardTitle>

        <CardDescription>
          Sign in to manage weekly reports and team activity.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>

            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              {...register("email")}
            />

            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            )}
            Sign in
          </Button>
        </form>

        <div className="rounded-xl border bg-muted/40 p-4">
          <button
            type="button"
            onClick={() => setShowDemoAccounts((current) => !current)}
            className="flex w-full items-center justify-between text-sm font-medium hover:underline"
          >
            <span>{showDemoAccounts ? "Hide" : "Show"} demo accounts</span>
            {showDemoAccounts ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>

          {showDemoAccounts && (
            <div className="mt-4 space-y-3 text-sm">
              <button
                type="button"
                className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors"
                onClick={() =>
                  useDemoAccount("manager@weeklyreport.dev", "Manager@123")
                }
              >
                <span className="font-medium text-foreground">Manager:</span>{" "}
                manager@weeklyreport.dev
              </button>

              <button
                type="button"
                className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors"
                onClick={() =>
                  useDemoAccount("kasun@weeklyreport.dev", "Member@123")
                }
              >
                <span className="font-medium text-foreground">Member:</span>{" "}
                kasun@weeklyreport.dev
              </button>

              <button
                type="button"
                className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors"
                onClick={() =>
                  useDemoAccount("admin@weeklyreport.dev", "Admin@123")
                }
              >
                <span className="font-medium text-foreground">Admin:</span>{" "}
                admin@weeklyreport.dev
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
