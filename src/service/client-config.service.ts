import { Injectable } from '@nestjs/common';
import { ClientConfigOptions } from '../types/ClientConfigOptions';
import { Axios } from 'axios';
import { Logger } from '@nestutils/logger';

@Injectable()
export class ClientConfigService {
  private readonly logger = new Logger({ context: ClientConfigService.name });
  private configOptions: ClientConfigOptions;
  private axiosInstance: Axios;
  private configProperties: Record<string, any> = {};

  /**
   * @param {ClientConfigOptions} configOptions
   */
  constructor(configOptions: ClientConfigOptions) {
    this.configOptions = configOptions;
    this.axiosInstance = new Axios({
      baseURL: this.configOptions.serverUrl,
      timeout: this.configOptions.timeout,
    });
  }

  /**
   * Load configuration from client
   * @param {ClientConfigOptions} configOptions
   * @returns {Promise<ClientConfigService>}
   */
  async loadProperties(): Promise<void> {
    // Connect With Config Server & Fetch Environment Profile Data.
    this.logger.info(
      'Loading Configuration Via Configuration: %o',
      this.configOptions,
    );

    let environmentConfiguration: Record<string, string> = {};

    // Load Configuration From Server
    try {
      let response = await this.axiosInstance.get<
        Record<string, string> | string
      >(`/configuration`, {
        params: { applicationId: this.configOptions.applicationId },
      });

      if (response.status && response.status === 200) {
        if (typeof (response.data === 'string')) {
          response.data = this.parseValidJSON(response.data as string);
        }
        environmentConfiguration =
          (response.data as Record<string, string>) || {};
      } else {
        this.logger.warn(
          `Status Code Received From Config Server Is : ${response.status}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to Load Configuration From Server With Error : ${error}`,
      );
    }

    // Set Fetched Config Properties Into Class Variable.
    this.configProperties = environmentConfiguration;

    // Apply Configuration to process.env
    for (let key in environmentConfiguration) {
      process.env[key] = environmentConfiguration[key];
    }
    this.logger.log(`Configuration Loading Completed.`);
  }

  /**
   * Parse Valid JSON string into JSON.
   * @param value
   * @returns
   */
  private parseValidJSON(value: string): Record<string, string> {
    try {
      return JSON.parse(value);
    } catch (error) {
      return {};
    }
  }

  /**
   * Get a property from config property. If not present in config, then lookup into process.env
   * @param property
   * @returns
   */
  public get<T = any>(property: string): T | undefined {
    let value = this.configProperties[property];

    if (value !== undefined) {
      return value as T;
    }

    value = process.env[property];
    return value as T | undefined;
  }
}
