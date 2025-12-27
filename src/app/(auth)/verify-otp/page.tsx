"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import scrapizLogo from "@/assets/scrapiz-logo.png";
import { Shield, ArrowLeft, RefreshCw } from "lucide-react";

export default function VerifyOTPPage() {
  const router = useRouter();
  const { verifyEmail, resendOTP, pendingEmail, requiresVerification, isLoading: authLoading } = useAuth();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Redirect if no pending email (user didn't come from login)
  useEffect(() => {
    if (!authLoading && !pendingEmail && !requiresVerification) {
      router.push("/login");
    }
  }, [pendingEmail, requiresVerification, authLoading, router]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await verifyEmail(otp);
      // After verification, user needs to login again
      // The verifyEmail function handles the redirect
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    setError(null);
    setSuccess(null);

    try {
      await resendOTP();
      setSuccess("A new OTP has been sent to your email");
      setCountdown(60); // 60 second cooldown
      setOtp("");
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    router.push("/login");
  };

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && !isLoading) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-md w-full" role="main" aria-labelledby="otp-title">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Image
              src={scrapizLogo}
              alt="Scrapiz Logo"
              width={100}
              height={100}
              className="object-contain"
              priority
            />
          </div>
          
          <div className="flex items-center justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <CardTitle id="otp-title" className="text-2xl">
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-center">
            Enter the 6-digit verification code sent to
            <br />
            <span className="font-medium text-foreground">{pendingEmail}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" role="alert" aria-live="assertive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 text-green-700" role="status">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
              disabled={isLoading}
              className="gap-2"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="h-14 w-12 text-xl border-2 focus:border-primary focus:ring-primary" />
                <InputOTPSlot index={1} className="h-14 w-12 text-xl border-2 focus:border-primary focus:ring-primary" />
                <InputOTPSlot index={2} className="h-14 w-12 text-xl border-2 focus:border-primary focus:ring-primary" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} className="h-14 w-12 text-xl border-2 focus:border-primary focus:ring-primary" />
                <InputOTPSlot index={4} className="h-14 w-12 text-xl border-2 focus:border-primary focus:ring-primary" />
                <InputOTPSlot index={5} className="h-14 w-12 text-xl border-2 focus:border-primary focus:ring-primary" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerify}
            className="w-full h-12 text-base font-medium"
            disabled={isLoading || otp.length !== 6}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </Button>

          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={isResending || countdown > 0}
              className="text-primary hover:text-primary"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                "Resend OTP"
              )}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            The OTP will expire in 5 minutes. If you don't see the email, check your spam folder.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
