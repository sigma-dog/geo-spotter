import { combineReducers } from '@reduxjs/toolkit';

import { general } from 'shared/generalModel/slice';

export const geospotter = combineReducers({
    general,
});

export const reducers = { geospotter };
