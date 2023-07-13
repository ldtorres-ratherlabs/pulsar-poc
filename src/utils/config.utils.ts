export function parseEnvVarStringToArray(env: string) {
  return !!env ? env.split(',') : undefined;
}
