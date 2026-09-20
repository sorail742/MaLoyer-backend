import { Global, Module } from '@nestjs/common';
import { MinioStorageProvider } from './minio-storage.provider';
import { STORAGE_PROVIDER } from './storage-provider.interface';

/**
 * `@Global()` : tout module métier qui a besoin de stocker un fichier
 * injecte `STORAGE_PROVIDER` sans réimporter ce module (même pattern que
 * `PrismaModule`). Contrairement à `PaymentsModule`, câblé dans
 * `AppModule` dès maintenant — MinIO n'est pas une décision en attente
 * (ADR-0016).
 */
@Global()
@Module({
  providers: [{ provide: STORAGE_PROVIDER, useClass: MinioStorageProvider }],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
