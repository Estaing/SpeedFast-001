import client from 'prom-client';

client.collectDefaultMetrics({ prefix: 'vinfast_ev_api_' });

export const httpRequestDuration = new client.Histogram({
  name: 'vinfast_ev_api_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export const httpRequestsTotal = new client.Counter({
  name: 'vinfast_ev_api_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const vehicleRegistrations = new client.Counter({
  name: 'vinfast_ev_api_vehicle_registrations_total',
  help: 'Total number of vehicles registered',
  labelNames: ['model'],
});

export const metricsRegistry = client.register;
