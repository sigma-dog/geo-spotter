type Dispatch = import('./store').AppDispatch;
type State = import('./store').RootState;

declare type AppDispatch = Dispatch;
declare type RootState = State;
declare type AppGetState = () => State;
