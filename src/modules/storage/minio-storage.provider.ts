import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as Minio from 'minio';
import { AppConfig } from '../../config/configuration';
import {
  StorageProvider,
  StoredObject,
  UploadObjectRequest,
} from './storage-provider.interface';

/**
 * Implémentation MinIO (ADR-0016). Bucket unique, clé préfixée par
 * `organizationId` — pas d'isolation au niveau bucket (un bucket par
 * organisation ne passerait pas à l'échelle avec MinIO), l'isolation
 * multi-tenant reste portée par le préfixe de clé + le contrôle d'accès
 * applicatif (jamais une URL signée émise pour un fichier hors de
 * l'organisation de l'appelant — à vérifier par le module appelant, pas
 * ici : ce provider ne connaît pas l'utilisateur courant).
 *
 * Connexion paresseuse comme `PrismaService` : le bucket est créé au
 * premier upload, pas au démarrage du module — l'application ne doit pas
 * échouer si MinIO n'est pas encore joignable et qu'aucun fichier n'est
 * manipulé.
 */
@Injectable()
export class MinioStorageProvider implements StorageProvider {
  private readonly client: Minio.Client;
  private readonly bucket: string;
  private bucketEnsured = false;

  constructor(configService: ConfigService<AppConfig, true>) {
    const minio = configService.get('minio', { infer: true });
    this.client = new Minio.Client({
      endPoint: minio.endpoint,
      port: minio.port,
      useSSL: minio.useSsl,
      accessKey: minio.accessKey,
      secretKey: minio.secretKey,
    });
    this.bucket = minio.bucket;
  }

  private async ensureBucket(): Promise<void> {
    if (this.bucketEnsured) return;
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
    this.bucketEnsured = true;
  }

  async upload(request: UploadObjectRequest): Promise<StoredObject> {
    await this.ensureBucket();
    const key = `${request.organizationId}/${request.category}/${randomUUID()}-${request.fileName}`;
    await this.client.putObject(
      this.bucket,
      key,
      request.body,
      request.body.length,
      { 'Content-Type': request.contentType },
    );
    return { key };
  }

  async getSignedUrl(key: string, expirySeconds: number): Promise<string> {
    await this.ensureBucket();
    return this.client.presignedGetObject(this.bucket, key, expirySeconds);
  }

  async delete(key: string): Promise<void> {
    await this.ensureBucket();
    await this.client.removeObject(this.bucket, key);
  }
}
