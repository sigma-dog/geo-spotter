import { clearState, setIsLoading } from './actions';
import { selectIsLoading } from './selectors';

type GeneralModel = {
    selectors: {
        selectIsLoading: typeof selectIsLoading;
    };

    actions: {
        clearState: typeof clearState;
        setIsLoading: typeof setIsLoading;
    };
};

export const generalModel: GeneralModel = {
    selectors: {
        selectIsLoading,
    },

    actions: {
        clearState,
        setIsLoading,
    },
};
