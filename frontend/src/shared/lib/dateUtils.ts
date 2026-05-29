import { format, parse, parseISO } from 'date-fns';

export const dateInputToIso = (date: string) =>
    parse(date, 'yyyy-MM-dd', new Date()).toISOString();

export const isoToDateInput = (iso: string) =>
    format(parseISO(iso), 'yyyy-MM-dd');
