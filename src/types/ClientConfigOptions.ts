/**
 * Configuration, which will be used to connect with config server and fetch environment specific properties.
 */
export interface ClientConfigOptions {
  serverUrl: string;
  timeout?: number;
  applicationId: string;
}
