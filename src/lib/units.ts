/**
 * Unit conversion across length, weight, temperature, speed, area and volume.
 *
 * Every unit converts to and from its category's base unit. Linear units use a
 * simple factor; temperature uses explicit functions (offsets, not factors).
 * Converting is always `to.fromBase(from.toBase(value))`.
 */

export interface Unit {
  id: string
  name: string
  toBase: (value: number) => number
  fromBase: (value: number) => number
}

export interface Category {
  id: string
  name: string
  units: Unit[]
}

/** A unit related to the base by a multiplicative factor. */
function linear(id: string, name: string, factor: number): Unit {
  return {
    id,
    name,
    toBase: (v) => v * factor,
    fromBase: (v) => v / factor,
  }
}

export const CATEGORIES: Category[] = [
  {
    id: 'length',
    name: 'Length',
    units: [
      linear('mm', 'Millimeter (mm)', 0.001),
      linear('cm', 'Centimeter (cm)', 0.01),
      linear('m', 'Meter (m)', 1),
      linear('km', 'Kilometer (km)', 1000),
      linear('in', 'Inch (in)', 0.0254),
      linear('ft', 'Foot (ft)', 0.3048),
      linear('yd', 'Yard (yd)', 0.9144),
      linear('mi', 'Mile (mi)', 1609.344),
      linear('nmi', 'Nautical mile (nmi)', 1852),
    ],
  },
  {
    id: 'weight',
    name: 'Weight',
    units: [
      linear('mg', 'Milligram (mg)', 1e-6),
      linear('g', 'Gram (g)', 0.001),
      linear('kg', 'Kilogram (kg)', 1),
      linear('t', 'Tonne (t)', 1000),
      linear('oz', 'Ounce (oz)', 0.028349523125),
      linear('lb', 'Pound (lb)', 0.45359237),
      linear('st', 'Stone (st)', 6.35029318),
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    units: [
      { id: 'c', name: 'Celsius (°C)', toBase: (v) => v, fromBase: (v) => v },
      {
        id: 'f',
        name: 'Fahrenheit (°F)',
        toBase: (v) => ((v - 32) * 5) / 9,
        fromBase: (v) => (v * 9) / 5 + 32,
      },
      {
        id: 'k',
        name: 'Kelvin (K)',
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    units: [
      linear('mps', 'Meter/second (m/s)', 1),
      linear('kmh', 'Kilometer/hour (km/h)', 1 / 3.6),
      linear('mph', 'Mile/hour (mph)', 0.44704),
      linear('kn', 'Knot (kn)', 1852 / 3600),
      linear('fps', 'Foot/second (ft/s)', 0.3048),
    ],
  },
  {
    id: 'area',
    name: 'Area',
    units: [
      linear('mm2', 'Square millimeter (mm²)', 1e-6),
      linear('cm2', 'Square centimeter (cm²)', 1e-4),
      linear('m2', 'Square meter (m²)', 1),
      linear('km2', 'Square kilometer (km²)', 1e6),
      linear('ha', 'Hectare (ha)', 10000),
      linear('acre', 'Acre', 4046.8564224),
      linear('in2', 'Square inch (in²)', 0.00064516),
      linear('ft2', 'Square foot (ft²)', 0.09290304),
      linear('mi2', 'Square mile (mi²)', 2589988.110336),
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    units: [
      linear('ml', 'Milliliter (ml)', 0.001),
      linear('l', 'Liter (l)', 1),
      linear('m3', 'Cubic meter (m³)', 1000),
      linear('tsp', 'Teaspoon (US)', 0.00492892159375),
      linear('tbsp', 'Tablespoon (US)', 0.01478676478125),
      linear('floz', 'Fluid ounce (US)', 0.0295735295625),
      linear('cup', 'Cup (US)', 0.2365882365),
      linear('pt', 'Pint (US)', 0.473176473),
      linear('qt', 'Quart (US)', 0.946352946),
      linear('gal', 'Gallon (US)', 3.785411784),
      linear('in3', 'Cubic inch (in³)', 0.016387064),
      linear('ft3', 'Cubic foot (ft³)', 28.316846592),
    ],
  },
]

/** Convert a value from one unit to another (both in the same category). */
export function convertUnit(value: number, from: Unit, to: Unit): number {
  return to.fromBase(from.toBase(value))
}

/** Trim floating-point noise and trailing zeros for display. */
export function formatResult(value: number): string {
  if (!Number.isFinite(value)) return ''
  return String(Number.parseFloat(value.toPrecision(10)))
}
