"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { appConfigService } from "@/services/appConfigService"

export default function SellScreenEnforcementToggle() {
  const [enforced, setEnforced] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setInitialLoading(true)
      const config = await appConfigService.getConfig()
      setEnforced(config.enforce_sell_screen_gate)
      setError(null)
    } catch (err: any) {
      console.error("Failed to load config:", err)
      setError("Failed to load configuration. Using default value.")
    } finally {
      setInitialLoading(false)
    }
  }

  const handleToggle = async (checked: boolean) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await appConfigService.toggleSellScreenEnforcement(checked)
      setEnforced(checked)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error("Failed to update config:", err)
      setError(err.message || "Failed to update configuration")
      // Revert on error
      setEnforced(!checked)
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sell Screen Configuration</CardTitle>
          <CardDescription>Loading configuration...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sell Screen Configuration</CardTitle>
        <CardDescription>
          Control whether users need to pass serviceability checks to access the sell screen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="enforce-gate" className="text-base font-medium">
              Enforce Sell Screen Gate
            </Label>
            <p className="text-sm text-muted-foreground">
              {enforced
                ? "Users must pass serviceability checks to access sell screen"
                : "Users can access sell screen directly without location verification"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Switch
              id="enforce-gate"
              checked={enforced}
              onCheckedChange={handleToggle}
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Configuration updated successfully</AlertDescription>
          </Alert>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Tip:</strong> Disable enforcement for testing or if serviceability API has issues.
            Changes take effect immediately for new app sessions (cache expires after 5 minutes).
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
