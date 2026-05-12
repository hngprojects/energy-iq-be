/**
 * MetricEvent - SSE wire format
 *
 * The JSON payload sent to the browser via Server-Sent Events.
 * Power values are converted from kW (database storage) to W (wire format).
 */
export interface MetricEvent {
  // Required fields
  inverter_id: string; // UUID
  recorded_at: string; // ISO 8601 UTC timestamp
  battery_soc: number; // 0–100 %
  solar_power_w: number; // watts (converted from kW)
  ac_output_power_w: number; // watts (converted from kW)
  grid_voltage_v: number; // volts
  grid_frequency_hz: number; // Hz
  inverter_status: string; // e.g., "normal", "fault"

  // Optional fields (null when not available from brand API)
  battery_voltage_v: number | null;
  battery_current_a: number | null;
  battery_temperature_c: number | null;
  battery_time_to_go_min: number | null;
  inverter_temperature_c: number | null;
}
