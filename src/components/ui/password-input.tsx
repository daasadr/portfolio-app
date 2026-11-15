"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/** Password field with its own show/hide toggle (Edge's built-in reveal icon is hidden in globals.css). */
const PasswordInput = React.forwardRef<HTMLInputElement, Omit<React.ComponentProps<"input">, "type">>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)
    return (
      <div className="relative">
        <Input ref={ref} type={visible ? "text" : "password"} className={cn("pr-10", className)} {...props} />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute inset-y-0 right-0 z-10 flex w-10 items-center justify-center rounded-r-md text-gray-500 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label={visible ? "Skrýt heslo" : "Zobrazit heslo"}
          title={visible ? "Skrýt heslo" : "Zobrazit heslo"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
