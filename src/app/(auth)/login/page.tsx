"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "next/navigation";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import scrapizLogo from "@/assets/scrapiz-logo.png";
import { CheckCircle2 } from "lucide-react";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for verified query param
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccessMessage('Email verified successfully! You can now login.');
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full" role="main" aria-labelledby="login-title">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Image 
              src={scrapizLogo} 
              alt="Scrapiz Logo" 
              width={120} 
              height={120}
              className="object-contain"
              priority
            />
          </div>
          <CardTitle id="login-title" className="text-2xl text-center">Scrapiz Admin</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} aria-label="Login form">
            <div className="grid gap-4">
              {successMessage && (
                <Alert className="border-green-500 bg-green-50 text-green-700" role="status">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert variant="destructive" role="alert" aria-live="assertive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@scrapiz.in"
                  {...register("email")}
                  disabled={isLoading}
                  aria-required="true"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  autoComplete="email"
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  {...register("password")}
                  disabled={isLoading}
                  aria-required="true"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  autoComplete="current-password"
                />
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2" 
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-[120px] h-[120px] bg-muted animate-pulse rounded" />
          </div>
          <CardTitle className="text-2xl text-center">Scrapiz Admin</CardTitle>
          <CardDescription className="text-center">
            Loading...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
