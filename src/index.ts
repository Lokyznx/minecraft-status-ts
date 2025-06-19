export { queryJavaServer, MinecraftQueryError as JavaQueryError } from './protocols/java/queryJavaServer';
export { queryBedrockServer, MinecraftQueryError as BedrockQueryError } from './protocols/bedrock/queryBedrockServer';

export type { JavaServerStatus } from './protocols/java/types';
export type { BedrockServerStatus } from './protocols/bedrock/types';
