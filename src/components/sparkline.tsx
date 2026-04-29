import { cn } from "@/lib/cn"

interface Props {
  values: number[]
  className?: string
  stroke?: string
  fill?: string
  width?: number
  height?: number
}

export function Sparkline({
  values,
  className,
  stroke = "currentColor",
  fill = "none",
  width = 120,
  height = 32,
}: Props) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(1, max - min)
  const step = width / (values.length - 1)
  const pts = values.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / span) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const path = `M${pts.join(" L")}`
  const area = `${path} L${width},${height} L0,${height} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full h-full", className)}
    >
      {fill !== "none" && <path d={area} fill={fill} />}
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
