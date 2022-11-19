import { Injectable, Logger } from '@nestjs/common';
import { ClientConfigOptions } from '../types/ClientConfigOptions';
import { Axios } from 'axios';

@Injectable()
export class ClientConfigService {
  private static readonly logger = new Logger(ClientConfigService.name);
  configOptions: ClientConfigOptions;

  /**
   * @param {ClientConfigOptions} configOptions
   */
  constructor(configOptions: ClientConfigOptions) {
    // Disable Colors In Logger.
    process.env.NO_COLOR = 'true';
    this.configOptions = configOptions;
  }

  /**
   * Load configuration from client
   * @param {ClientConfigOptions} configOptions
   * @returns {Promise<ClientConfigService>}
   */
  static async load(configOptions: ClientConfigOptions): Promise<void> {
    await this.loadConfigAsync(configOptions);
  }

  /**
   * @param {ClientConfigOptions} configOptions
   * @returns {Promise<void>}
   */
  protected static async loadConfigAsync(
    configOptions: ClientConfigOptions,
  ): Promise<void> {
    // Connect With Config Server & Fetch Environment Profile Data.
    this.logger.log(
      `Loading Configuration Via Configuration: ${JSON.stringify(
        configOptions,
      )}`,
    );

    let environmentConfiguration: Record<string, string> = {};

    const axiosInstance = new Axios({
      baseURL: configOptions.serverUrl,
      timeout: configOptions.timeout,
    });
    // Load Configuration From Server
    try {
      let response = await axiosInstance.get<Record<string, string> | string>(
        `/configuration`,
        { params: { applicationId: configOptions.applicationId } },
      );

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

    // Apply Configuration to process.env
    for (let key in environmentConfiguration) {
      process.env[key] = environmentConfiguration[key];
    }
    this.logger.log(`Configuration Loading Completed.`);
  }

  private static parseValidJSON(value: string): Record<string, string> {
    try {
      return JSON.parse(value);
    } catch (error) {
      return {};
    }
  }
}
