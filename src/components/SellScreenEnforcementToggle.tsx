"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, CheckCircle2, Info, Loader2, MapPin, Navigation, ShieldOff } from "lucide-react"
import { appConfigService } from "@/services/appConfigService"

type GateMode = 'none' | 'pincode' | 'city'

const gateOptions: Array<{
  id: GateMode
  title: string
  description: string
  icon: typeof ShieldOff
}> = [
  {
    id: 'pincode',
    title: 'Pincode Gate',
    description: 'Users must enter a serviceable pincode before using the sell flow.',
    icon: MapPin,
  },
  {
    id: 'city',
    title: 'City GPS Gate',
    description: 'Users must share live location and fall inside an available service city.',
    icon: Navigation,
  },
  {
    id: 'none',
    title: 'No Gate',
    description: 'Sell screen stays open without location validation.',
    icon: ShieldOff,
  },
]

export default function SellScreenEnforcementToggle() {
  const [mode, setMode] = useState<GateMode>('pincode')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    void loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setInitialLoading(true)
      const config = await appConfigService.getConfig()
      setMode(config.sell_screen_gate_mode || (config.enforce_sell_screen_gate ? 'pincode' : 'none'))
      setError(null)
    } catch (err: any) {
      console.error("Failed to load config:", err)
      setError("Failed to load configuration. Using default value.")
    } finally {
      setInitialLoading(false)
    }
  }

  const handleModeChange = async (nextMode: GateMode) => {
    if (mode === nextMode) {
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await appConfigService.setSellScreenGateMode(nextMode)
      setMode(nextMode)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error("Failed to update config:", err)
      setError(err.message || "Failed to update configuration")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sell Screen Gate Mode</CardTitle>
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Sell Screen Gate Mode</CardTitle>
            <CardDescription>
              Choose one active gate mode or disable sell-screen gating entirely.
            </CardDescription>
          </div>
          <Badge variant="outline" className="capitalize">
            {mode === 'none' ? 'disabled' : mode}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-3">
          {gateOptions.map((option) => {
            const Icon = option.icon
            const active = mode === option.id

            return (
              <div
                key={option.id}
                className={`rounded-xl border p-4 transition-all ${
                  active
                    ? 'border-green-500 bg-green-50 shadow-sm dark:border-green-700 dark:bg-green-950/40'
                    : 'border-border bg-background'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-lg p-2 ${active ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <Label className="text-base font-semibold">{option.title}</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  <Switch
                    checked={active}
                    onCheckedChange={(checked) => {
                      void handleModeChange(checked ? option.id : 'none')
                    }}
                    disabled={loading}
                    aria-label={`Enable ${option.title}`}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Emergency bypass</p>
            <p className="text-sm text-muted-foreground">
              Disable all sell gates temporarily without changing city or pincode data.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleModeChange('none')}
            disabled={loading || mode === 'none'}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Disable gating
          </Button>
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
            <strong>Tip:</strong> City GPS gate uses the cities marked as <em>Available</em> in this page and validates live coordinates against each city radius.
            Only one mode can be active at a time.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
