/** Rounded square & rectangle expense widgets. */

export interface WidgetShape {
  id: string
  className: string
  colSpan: 1 | 2
}

export const WIDGET_SHAPES: WidgetShape[] = [
  { id: 'square', className: 'widget-shape--square', colSpan: 1 },
  { id: 'square', className: 'widget-shape--square', colSpan: 1 },
  { id: 'rect', className: 'widget-shape--rect', colSpan: 2 },
]

export function shapeForIndex(index: number): WidgetShape {
  return WIDGET_SHAPES[index % WIDGET_SHAPES.length]
}

/** Realistic card tones — base + highlight for depth. */
export interface CardTheme {
  tint: string
  tintLight: string
  onTint: string
}

export const CARD_COLORS: CardTheme[] = [
  { tint: '#404044', tintLight: '#58585e', onTint: '#f4f4f1' },
  { tint: '#454240', tintLight: '#5d5a56', onTint: '#f4f2ef' },
  { tint: '#404648', tintLight: '#585e62', onTint: '#f1f4f5' },
  { tint: '#424048', tintLight: '#5a5862', onTint: '#f3f2f5' },
  { tint: '#464642', tintLight: '#5e5e58', onTint: '#f4f4f0' },
  { tint: '#3c4046', tintLight: '#545a60', onTint: '#f2f4f6' },
]

export function colorForShapeIndex(index: number): CardTheme {
  return CARD_COLORS[index % CARD_COLORS.length]
}
