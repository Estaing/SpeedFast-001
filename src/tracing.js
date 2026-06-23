import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const serviceName = process.env.SERVICE_NAME || 'vinfast-ev-api';

// Tracing is optional in local/test environments — only wire it up if an
// OTLP collector endpoint is actually configured, so devs without a
// Jaeger/Tempo stack running locally aren't forced to set one up.
if (otlpEndpoint) {
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
    traceExporter: new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  process.on('SIGTERM', () => {
    sdk.shutdown().finally(() => process.exit(0));
  });

  // eslint-disable-next-line no-console
  console.log(`[otel] tracing enabled, exporting to ${otlpEndpoint}`);
} else {
  // eslint-disable-next-line no-console
  console.log('[otel] OTEL_EXPORTER_OTLP_ENDPOINT not set, tracing disabled');
}
