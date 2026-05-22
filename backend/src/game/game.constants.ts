export const TASK_ATTEMPT_SOURCE = {
    ai: 'ai',
    mock: 'mock',
} as const;

export const TASK_ATTEMPT_VERDICT = {
    match: 'match',
    noMatch: 'no_match',
    uncertain: 'uncertain',
} as const;

export const TASK_ATTEMPT_STATUS = {
    completed: 'COMPLETED',
    failed: 'FAILED',
    pending: 'PENDING',
} as const;
