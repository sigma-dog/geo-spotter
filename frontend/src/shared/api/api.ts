import { createApi } from '@reduxjs/toolkit/query/react';

import { tagTypes } from './constants';
import { baseQueryWithReauth } from './utils';

export const api = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: Object.values(tagTypes),
    endpoints: () => ({}),
});
