const selectState = (state: RootState) => state.geospotter.general;

export const selectIsLoading = (state: RootState) =>
    selectState(state).isLoading;
