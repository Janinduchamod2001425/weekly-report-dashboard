"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
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
      router.refresh();
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
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-3xl">Welcome back</CardTitle>

        <CardDescription>
          Sign in to manage weekly reports and team activity.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-0">
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

            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              {...register("password")}
            />

            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
            Sign in
          </Button>
        </form>

        <div className="rounded-xl border bg-muted/40 p-4">
          <button
            type="button"
            onClick={() => setShowDemoAccounts((current) => !current)}
            className="text-sm font-medium"
          >
            {showDemoAccounts ? "Hide" : "Show"} demo accounts
          </button>

          {showDemoAccounts && (
            <div className="mt-4 space-y-2 text-sm">
              <button
                type="button"
                className="block text-left text-muted-foreground hover:text-foreground"
                onClick={() =>
                  useDemoAccount("manager@weeklyreport.dev", "Manager@123")
                }
              >
                Manager: manager@weeklyreport.dev
              </button>

              <button
                type="button"
                className="block text-left text-muted-foreground hover:text-foreground"
                onClick={() =>
                  useDemoAccount("kasun@weeklyreport.dev", "Member@123")
                }
              >
                Member: kasun@weeklyreport.dev
              </button>

              <button
                type="button"
                className="block text-left text-muted-foreground hover:text-foreground"
                onClick={() =>
                  useDemoAccount("admin@weeklyreport.dev", "Admin@123")
                }
              >
                Admin: admin@weeklyreport.dev
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
