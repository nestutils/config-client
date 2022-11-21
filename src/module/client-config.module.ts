import { DynamicModule, Module, Global } from '@nestjs/common';
import { ClientConfigOptions } from '../types/ClientConfigOptions';
import { ClientConfigService } from '../service/client-config.service';

@Global()
@Module({})
export class ClientConfigModule {
  /**
   * @param {ClientConfigOptions} configOptions
   * @returns {DynamicModule}
   */
  static async forRootAsync(
    configOptions: ClientConfigOptions,
  ): Promise<DynamicModule> {
    const clientConfigService = new ClientConfigService(configOptions);
    await clientConfigService.loadProperties();
    const clientConfigProvider = {
      provide: ClientConfigService,
      useFactory: (): ClientConfigService => {
        return clientConfigService;
      },
    };
    return {
      module: ClientConfigModule,
      providers: [clientConfigProvider],
      exports: [clientConfigProvider],
    };
  }
}
