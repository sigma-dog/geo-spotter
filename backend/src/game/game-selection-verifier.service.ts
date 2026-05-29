import { Injectable } from '@nestjs/common';
import type { SubmitSelectionDto } from './dto/submit-selection.dto';
import { TASK_ATTEMPT_SOURCE, TASK_ATTEMPT_VERDICT } from './game.constants';
import type {
    PreparedSelectionAsset,
    VerificationResponse,
} from './game.types';

@Injectable()
export class GameSelectionVerifierService {
    verifySelection(params: {
        asset: PreparedSelectionAsset;
        task: SubmitSelectionDto['task'];
    }): Omit<VerificationResponse, 'attemptId'> {
        const { asset, task } = params;
        const areaRatio =
            (asset.cropWidthPx * asset.cropHeightPx) /
            (asset.sourceImageWidth * asset.sourceImageHeight);
        const looksLikeVehicleTask = /машин|авто|car|vehicle/i.test(
            task.target
        );
        const looksLikeColorTask =
            /желт|yellow|красн|red|син|blue|зелен|green/i.test(task.target);

        let verdict: VerificationResponse['verdict'] =
            TASK_ATTEMPT_VERDICT.uncertain;
        let confidence = 0.58;
        let reason =
            'Кадр и crop уже подготовлены на backend, но итоговую AI-проверку пока выполняет mock verifier.';

        if (areaRatio < 0.02) {
            verdict = TASK_ATTEMPT_VERDICT.noMatch;
            confidence = 0.91;
            reason =
                'Рамка слишком маленькая относительно кадра, поэтому объект не засчитан.';
        } else if (areaRatio > 0.45) {
            verdict = TASK_ATTEMPT_VERDICT.noMatch;
            confidence = 0.87;
            reason =
                'Рамка захватывает слишком большую часть сцены и не подходит для точной верификации.';
        } else if (
            looksLikeVehicleTask &&
            looksLikeColorTask &&
            areaRatio <= 0.18
        ) {
            verdict = TASK_ATTEMPT_VERDICT.match;
            confidence = 0.86;
            reason =
                'Моковый verifier считает crop реалистичным кандидатом для задачи на цветной транспорт.';
        } else if (areaRatio >= 0.03 && areaRatio <= 0.25) {
            confidence = 0.67;
            reason =
                'Crop выглядит валидно по размеру, но точный вердикт должен вернуть отдельный AI-сервис.';
        }

        return {
            confidence,
            reason,
            source: TASK_ATTEMPT_SOURCE.mock,
            verdict,
        };
    }
}
