/**
 * Time constants in milliseconds
 */
export enum Time {
  ONE_SECOND = 1000,
  ONE_MINUTE = 60 * ONE_SECOND,
  ONE_HOUR = 60 * ONE_MINUTE,
  ONE_DAY = 24 * ONE_HOUR,
  ONE_WEEK = 7 * ONE_DAY,
  ONE_MONTH = 30 * ONE_DAY,
  ONE_YEAR = 365 * ONE_DAY,
}

export const toSeconds = (ms: number) => ms / 1000;
export const toMilliseconds = (seconds: number) => seconds * 1000;
