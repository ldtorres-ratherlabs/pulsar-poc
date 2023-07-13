import { IsNotEmpty, IsString } from 'class-validator';

export class PulsarConfig {
  @IsString()
  @IsNotEmpty()
  serviceUrl: string = process.env.PULSAR_SERVICE_URL || 'pulsar://localhost:6650';
}
