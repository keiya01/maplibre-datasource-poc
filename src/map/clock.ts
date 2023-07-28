const DEFAULT_CLOCK_START = new Date(Date.now() - 86400000);
export const DEFAULT_CLOCK: Clock = {
  start: DEFAULT_CLOCK_START,
  current: DEFAULT_CLOCK_START,
  end: new Date(),
};

export type Clock = {
  start: Date;
  end: Date;
  current: Date;
  speed?: number;
};

export const clampCurrent = (clock: Clock, current: Date, to: Clock): Date => {
  return current.getTime() < clock.start.getTime()
    ? new Date(to.start)
    : current.getTime() > clock.end.getTime()
    ? new Date(to.end)
    : current;
};
