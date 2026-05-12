import { NormalisedMetric } from '../../inverters/types';
import { MetricEvent } from '../types/metric-event.interface';

// snake case, and kilowatts to watts
export function toMetricEvent(metric: NormalisedMetric): MetricEvent {
  return {
    // Identity and timestamp
    inverter_id: metric.inverterId,
    recorded_at: metric.recordedAt,

    // Required metrics
    battery_soc: metric.batterySoc,
    solar_power_w: metric.solarPowerKw * 1000,
    ac_output_power_w: metric.acOutputPowerKw * 1000,
    grid_voltage_v: metric.gridVoltageV,
    grid_frequency_hz: metric.gridFrequencyHz,
    inverter_status: metric.inverterStatus,

    // Optional
    battery_voltage_v: metric.batteryVoltageV,
    battery_current_a: metric.batteryCurrentA,
    battery_temperature_c: metric.batteryTemperatureC,
    battery_time_to_go_min: metric.batteryTimeToGoMin,
    inverter_temperature_c: metric.inverterTemperatureC,
  };
}
