import { createSlice } from '@reduxjs/toolkit';

import { clearState, setIsLoading } from './actions';
import { GENERAL_SLICE_NAME } from './config';

type State = {
    isLoading: boolean;
};

const initialState: State = {
    isLoading: false,
};

const generalSlice = createSlice({
    name: GENERAL_SLICE_NAME,
    initialState,
    reducers: {},
    extraReducers: ({ addCase }) => {
        addCase(clearState, () => initialState);
        addCase(setIsLoading, (state, { payload }) => {
            state.isLoading = payload;
        });
    },
});

export const general = generalSlice.reducer;
