"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ImageLoadingStatus = "idle" | "loading" | "loaded" | "error"

interface AvatarContextValue {
  status: ImageLoadingStatus
  setStatus: React.Dispatch<React.SetStateAction<ImageLoadingStatus>>
}

const AvatarContext = React.createContext<AvatarContextValue | null>(null)

function useAvatarContext() {
  return React.useContext(AvatarContext)
}

interface AvatarProps extends React.ComponentProps<"span"> {
  size?: "default" | "sm" | "lg"
}

function Avatar({
  className,
  size = "default",
  children,
  ...props
}: AvatarProps) {
  const [status, setStatus] = React.useState<ImageLoadingStatus>("idle")

  return (
    <AvatarContext.Provider value={{ status, setStatus }}>
      <span
        data-slot="avatar"
        data-size={size}
        className={cn(
          "group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten overflow-hidden",
          className
        )}
        {...props}
      >
        {children}
      </span>
    </AvatarContext.Provider>
  )
}

interface AvatarImageProps extends Omit<React.ComponentProps<"img">, "src"> {
  src?: string
  fallbackSrc?: string
  onLoadingStatusChange?: (status: ImageLoadingStatus) => void
}

function AvatarImage({
  className,
  src,
  fallbackSrc,
  alt,
  onLoadingStatusChange,
  ...props
}: AvatarImageProps) {
  const context = useAvatarContext()
  const [currentSrc, setCurrentSrc] = React.useState<string | undefined>(src)

  React.useEffect(() => {
    setCurrentSrc(src)
  }, [src])

  React.useEffect(() => {
    if (!currentSrc || typeof currentSrc !== "string") {
      context?.setStatus("error")
      onLoadingStatusChange?.("error")
      return
    }

    let isMounted = true
    context?.setStatus("loading")
    onLoadingStatusChange?.("loading")

    if (typeof window !== "undefined") {
      const img = new window.Image()
      img.src = currentSrc
      if (props.crossOrigin) {
        img.crossOrigin = props.crossOrigin
      }
      if (props.referrerPolicy) {
        img.referrerPolicy = props.referrerPolicy
      }

      img.onload = () => {
        if (!isMounted) return
        context?.setStatus("loaded")
        onLoadingStatusChange?.("loaded")
      }
      img.onerror = () => {
        if (!isMounted) return
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          // If primary image returns 404, gracefully load fallbackSrc
          setCurrentSrc(fallbackSrc)
          return
        }
        context?.setStatus("error")
        onLoadingStatusChange?.("error")
      }

      if (img.complete) {
        if (img.naturalWidth > 0) {
          context?.setStatus("loaded")
          onLoadingStatusChange?.("loaded")
        } else if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc)
        } else {
          context?.setStatus("error")
          onLoadingStatusChange?.("error")
        }
      }
    }

    return () => {
      isMounted = false
    }
  }, [currentSrc, fallbackSrc, props.crossOrigin, props.referrerPolicy])

  if (context?.status !== "loaded") {
    return null
  }

  return (
    <img
      data-slot="avatar-image"
      src={currentSrc}
      alt={alt}
      className={cn(
        "aspect-square size-full rounded-full object-cover",
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  const context = useAvatarContext()

  // If image is already loaded, do not show fallback
  if (context?.status === "loaded") {
    return null
  }

  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
