"use client"

import { useEffect, useRef } from "react"
import type { CSSProperties, ElementType } from "react"
import { animate, inView, stagger } from "motion"

type RevealOnViewProps = {
  as?: ElementType
  className?: string
  children: React.ReactNode
  /** Optional delay per item for staggered lists */
  delay?: number
  style?: CSSProperties
  /** If true, applies a stronger lift/blur for hero content */
  intensity?: "soft" | "hero"
  /** If true, will animate immediate children in a staggered sequence */
  staggerChildren?: boolean
  /** Override starting blur in px (default depends on intensity) */
  blurPx?: number
  /** Disable blur effect entirely for smoother, color-stable reveal */
  disableBlur?: boolean
  /** CSS selector of children to exclude from animation (default: [data-static="true"]) */
  excludeSelector?: string
}

export default function RevealOnView({ as = "div", className, children, delay = 0, style, intensity = "soft", staggerChildren = false, blurPx, disableBlur = false, excludeSelector = '[data-static="true"]' }: RevealOnViewProps) {
  const Tag = as as any
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isMobile =
      typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches

    const startTranslate = isMobile ? 10 : intensity === "hero" ? 28 : 18
    const startBlurDefault = isMobile ? 0 : intensity === "hero" ? 16 : 10
    const startBlur = disableBlur ? 0 : (typeof blurPx === "number" ? blurPx : startBlurDefault)
    const startScale = isMobile ? 1 : intensity === "hero" ? 0.965 : 0.98

    // Normalize delay: accept milliseconds (>=10) or seconds (<10)
    const toSeconds = (d: number) => (d < 10 ? d : d / 1000)
    const delaySec = toSeconds(delay)

    if (prefersReducedMotion) {
      const allChildren = Array.from(element.children).filter(
        (n): n is HTMLElement => n instanceof HTMLElement
      )
      const targets = staggerChildren
        ? (excludeSelector
            ? allChildren.filter((t) => !t.matches(excludeSelector))
            : allChildren)
        : [element]
      targets.forEach((t) => {
        t.style.opacity = "1"
        t.style.transform = "none"
        t.style.filter = "none"
      })
      return
    } else {
      // Ensure containment on mobile
      if (isMobile) {
        element.style.overflow = "hidden"
        ;(element.style as any).contain = "paint"
        element.style.transformOrigin = "center"
      }
      if (staggerChildren) {
        // Parent stays visible; children will handle their own initial state
        element.style.opacity = "1"
        element.style.transform = "none"
        element.style.filter = "none"
      } else {
        element.style.opacity = "0"
        element.style.transform = `translateY(${startTranslate}px) scale(${startScale})`
        element.style.filter = disableBlur ? "none" : `blur(${startBlur}px)`
      }
    }

    const cleanup = inView(element, () => {
      const allChildren = Array.from(element.children).filter(
        (n): n is HTMLElement => n instanceof HTMLElement
      )
      const targets = staggerChildren
        ? (excludeSelector ? allChildren.filter((t) => !t.matches(excludeSelector)) : allChildren)
        : [element]

      // Initialize all targets if we're staggering children
      if (staggerChildren) {
        const allChildrenInit = Array.from(element.children).filter(
          (n): n is HTMLElement => n instanceof HTMLElement
        )
        const initTargets = excludeSelector
          ? allChildrenInit.filter((t) => !t.matches(excludeSelector))
          : allChildrenInit
        initTargets.forEach((t) => {
          if (isMobile) {
            t.style.overflow = "hidden"
            t.style.transformOrigin = "center"
          }
          t.style.opacity = "0"
          t.style.transform = `translateY(${startTranslate}px) scale(${startScale})`
          t.style.filter = disableBlur ? "none" : `blur(${startBlur}px)`
        })
      }

      const animationProps = disableBlur
        ? { opacity: [1], transform: ["translateY(0) scale(1)"] }
        : { opacity: [1], transform: ["translateY(0) scale(1)"], filter: ["blur(0px)"] }

      const duration = isMobile ? 0.75 : 0.95
      const easeCurve = isMobile ? [0.25, 0.8, 0.25, 1] : [0.22, 1, 0.36, 1]
      const delayFn = targets.length > 1 ? stagger(0.1, { startDelay: delaySec }) : (_i: number, _total: number) => delaySec
      targets.forEach((t, i) => {
        animate(
          t,
          animationProps as any,
          { duration, delay: delayFn(i, targets.length), ease: easeCurve }
        )
      })
    })

    return () => {
      if (typeof cleanup === "function") cleanup()
    }
  }, [delay, intensity, staggerChildren, blurPx, disableBlur, excludeSelector])

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  )
}
