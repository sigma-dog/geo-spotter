import {
    IsOptional,
    IsISO8601,
    IsNumber,
    IsObject,
    IsString,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class TaskSnapshotDto {
    @IsString()
    id: string;

    @IsString()
    title: string;

    @IsString()
    target: string;
}

class NormalizedSelectionDto {
    @IsNumber()
    @Min(0)
    @Max(1)
    left: number;

    @IsNumber()
    @Min(0)
    @Max(1)
    top: number;

    @IsNumber()
    @Min(0.01)
    @Max(1)
    width: number;

    @IsNumber()
    @Min(0.01)
    @Max(1)
    height: number;
}

class WorldLocationDto {
    @IsNumber()
    @Min(-90)
    @Max(90)
    lat: number;

    @IsNumber()
    @Min(-180)
    @Max(180)
    lng: number;
}

class DebugPointDto {
    @IsNumber()
    x: number;

    @IsNumber()
    y: number;
}

class DebugSizeDto {
    @IsNumber()
    width: number;

    @IsNumber()
    height: number;
}

class DebugBoundsDto {
    @IsNumber()
    left: number;

    @IsNumber()
    top: number;

    @IsNumber()
    width: number;

    @IsNumber()
    height: number;
}

class DebugScaleDto {
    @IsNumber()
    x: number;

    @IsNumber()
    y: number;
}

class DebugSampleGridDto {
    @IsNumber()
    columns: number;

    @IsNumber()
    rows: number;
}

class DebugSelectionBoxDto {
    @IsNumber()
    left: number;

    @IsNumber()
    top: number;

    @IsNumber()
    width: number;

    @IsNumber()
    height: number;
}

class DebugInfoDto {
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => DebugPointDto)
    basicCorners?: DebugPointDto[];

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => DebugPointDto)
    basicSamplePoints?: DebugPointDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => DebugSizeDto)
    canvasBounds?: DebugSizeDto;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => DebugPointDto)
    canvasSamplePoints?: DebugPointDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => DebugSizeDto)
    canvasPixels?: DebugSizeDto;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => DebugPointDto)
    canvasSelectionCorners?: DebugPointDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => DebugSelectionBoxDto)
    overlaySelectionPixels?: DebugSelectionBoxDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => DebugBoundsDto)
    overlayBounds?: DebugBoundsDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => DebugScaleDto)
    scale?: DebugScaleDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => DebugSampleGridDto)
    sampleGrid?: DebugSampleGridDto;
}

export class SubmitSelectionDto {
    @IsISO8601()
    capturedAt: string;

    @IsString()
    imageId: string;

    @IsOptional()
    @IsString()
    imageThumbUrl?: string;

    @IsOptional()
    @IsString()
    sourceImageBase64?: string;

    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => DebugInfoDto)
    debugInfo?: DebugInfoDto;

    @IsObject()
    @ValidateNested()
    @Type(() => TaskSnapshotDto)
    task: TaskSnapshotDto;

    @IsObject()
    @ValidateNested()
    @Type(() => NormalizedSelectionDto)
    selection: NormalizedSelectionDto;

    @IsObject()
    @ValidateNested()
    @Type(() => WorldLocationDto)
    worldLocation: WorldLocationDto;
}
