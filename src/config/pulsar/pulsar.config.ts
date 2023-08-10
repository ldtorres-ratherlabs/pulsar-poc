import { IsNotEmpty, IsString } from 'class-validator';

export class PulsarConfig {
  @IsString()
  @IsNotEmpty()
  serviceUrl: string = process.env.PULSAR_SERVICE_URL || 'pulsar://localhost:6650';

  authParams: string | null = process.env.PULSAR_SERVICE_AUTH || null;

  useTls = false;

  tlsTrustCertsFilePath?: string;
  tlsValidateHostname?: boolean;
  tlsAllowInsecureConnection?: boolean = true;
}
