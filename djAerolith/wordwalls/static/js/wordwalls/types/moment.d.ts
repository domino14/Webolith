declare module 'moment' {
  interface Moment {
    toDate(): Date;
    format(format?: string): string;
  }

  namespace moment {
    type MomentInput = Date | string | number | Moment | null | undefined;
    type MomentFormatSpecification = string | string[];
  }

  interface MomentStatic {
    utc(
      inp?: moment.MomentInput,
      format?: moment.MomentFormatSpecification,
      strict?: boolean,
    ): Moment;
    (
      inp?: moment.MomentInput,
      format?: moment.MomentFormatSpecification,
      strict?: boolean,
    ): Moment;
  }

  const moment: MomentStatic;
  export = moment;
}
