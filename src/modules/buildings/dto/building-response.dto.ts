import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Building } from '../../../prisma/prisma-client';

/** Vue publique d'un `Building` — exclut `deletedAt`. */
export class BuildingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  city: string;

  @ApiPropertyOptional()
  floorsCount: number | null;

  @ApiProperty({ type: [String] })
  photos: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  private constructor(props: BuildingResponseDto) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.name = props.name;
    this.address = props.address;
    this.city = props.city;
    this.floorsCount = props.floorsCount;
    this.photos = props.photos;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static fromEntity(building: Building): BuildingResponseDto {
    return new BuildingResponseDto({
      id: building.id,
      organizationId: building.organizationId,
      name: building.name,
      address: building.address,
      city: building.city,
      floorsCount: building.floorsCount,
      photos: building.photos,
      createdAt: building.createdAt,
      updatedAt: building.updatedAt,
    });
  }
}
