import { GENERAL_SLICE_NAME } from './config';

export const getGeneralSliceActionPrefix = (name: string) =>
    `${GENERAL_SLICE_NAME}/${name}`;
