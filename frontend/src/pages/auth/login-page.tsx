import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { demoLogin, login } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/utils/errors";

const utf8ByteLength = (value: string): number => new TextEncoder().encode(value).length;

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or fewer.")
    .refine((value) => utf8ByteLength(value) <= 72, "Password must be 72 bytes or fewer."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      setAuth(response);
      const from = (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname;
      navigate(from || "/", { replace: true });
    },
  });

  const demoMutation = useMutation({
    mutationFn: demoLogin,
    onSuccess: (response) => {
      setAuth(response);
      navigate("/", { replace: true });
    },
  });

  const onSubmit = (values: LoginFormValues): void => {
    loginMutation.mutate(values);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <section className="animate-fade-in-up rounded-2xl border border-border/80 bg-card/90 p-8 shadow-2xl shadow-black/25 backdrop-blur-lg">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">Welcome Back</p>
        <h1 className="text-3xl font-semibold text-foreground">Sign in</h1>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
              Email
            </label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
              Password
            </label>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {loginMutation.isError && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getErrorMessage(loginMutation.error, "Unable to sign in. Please try again.")}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => demoMutation.mutate()} disabled={demoMutation.isPending}>
            {demoMutation.isPending ? "Loading demo..." : "Try Demo (No signup)"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          No account yet?{" "}
          <Link to="/register" className="font-semibold text-primary hover:text-primary/90">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
