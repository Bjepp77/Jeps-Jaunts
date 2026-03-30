"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export interface FlowStep {
  key: string
  label: string
  href: string
}

interface EventFlowStepperProps {
  steps: FlowStep[]
}

export function EventFlowStepper({ steps }: EventFlowStepperProps) {
  const pathname = usePathname()

  const currentIndex = steps.findIndex((s) => pathname.endsWith(s.key))
  const resolvedIndex = currentIndex === -1 ? 0 : currentIndex

  return (
    <nav aria-label="Quote flow steps">
      <ol className="flex items-center gap-0">
        {steps.map((step, i) => {
          const isCompleted = i < resolvedIndex
          const isCurrent = i === resolvedIndex
          const isLast = i === steps.length - 1

          return (
            <li key={step.key} className="flex items-center">
              <Link
                href={step.href}
                aria-current={isCurrent ? "step" : undefined}
                className={`flex items-center gap-2 text-xs tracking-wide font-body px-1 py-0.5 rounded transition ${
                  isCurrent
                    ? "text-charcoal"
                    : isCompleted
                    ? "text-brown-mid hover:text-charcoal"
                    : "text-brown-muted pointer-events-none"
                }`}
              >
                {/* Circle */}
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 border ${
                    isCurrent
                      ? "border-charcoal bg-charcoal text-bone"
                      : isCompleted
                      ? "border-charcoal bg-bone text-charcoal"
                      : "border-hairline bg-bone text-brown-muted"
                  }`}
                >
                  {isCompleted ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </Link>

              {!isLast && (
                <span className="mx-1 text-brown-muted/40 select-none font-body" aria-hidden>
                  /
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
