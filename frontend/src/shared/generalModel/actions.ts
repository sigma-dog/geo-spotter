import { createAction } from '@reduxjs/toolkit';

import { getGeneralSliceActionPrefix } from './utils';

export const clearState = createAction(
    getGeneralSliceActionPrefix('clearState')
);

export const setIsLoading = createAction<boolean>(
    getGeneralSliceActionPrefix('setIsLoading')
);
