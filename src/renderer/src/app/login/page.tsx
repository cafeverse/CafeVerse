import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Coffee, Mail, Lock, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage(): React.JSX.Element {
  const { login, error: apiError, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setValidationError(null)
    clearError()

    if (!email || !password) {
      setValidationError('Please fill in all fields.')
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Login error:', message)
    } finally {
      setIsLoading(false)
    }
  }

  const activeError = validationError || apiError

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md bg-card border border-border/40 rounded-xl p-8 shadow-sm">
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-[#1c1917] to-[#0c0a09] border border-white/5 mb-4">
            <Coffee className="size-6 text-primary" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground uppercase italic leading-none mb-2">
            Café<span className="text-primary not-italic">Verse</span>
          </h2>
          <p className="text-xs text-muted-foreground/60 text-center tracking-tight">
            Welcome back to the obsidian theater. Sign in to manage your collection.
          </p>
        </div>

        {/* Form Alerts */}
        {activeError && (
          <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3.5 mb-6">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-semibold tracking-tight">{activeError}</div>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground/70 tracking-widest uppercase block select-none">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground/50 pointer-events-none" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
                className="pl-9 h-10 border-border/40 focus-visible:ring-primary/45 focus-visible:border-primary"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-muted-foreground/70 tracking-widest uppercase block select-none">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground/50 pointer-events-none" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="pl-9 pr-10 h-10 border-border/40 focus-visible:ring-primary/45 focus-visible:border-primary"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-3 text-muted-foreground/50 hover:text-foreground cursor-pointer focus:outline-hidden"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-wider cursor-pointer mt-2"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
            {!isLoading && <ArrowRight className="size-4 ml-1.5" />}
          </Button>
        </form>

        {/* Navigation Link */}
        <div className="mt-8 text-center text-xs border-t border-border/20 pt-6">
          <span className="text-muted-foreground/50">New to CaféVerse? </span>
          <Link
            to="/register"
            onClick={clearError}
            className="text-primary hover:underline font-bold transition-colors cursor-pointer"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
}
