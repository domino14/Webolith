declare module 'bootstrap-datepicker' {
  // This module just adds datepicker functionality to jQuery
  // The actual types are added to the jQuery interface
}

declare global {
  interface JQuery {
    datepicker(options?: {
      startDate?: Date;
      todayBtn?: string;
      todayHighlight?: boolean;
      autoclose?: boolean;
      endDate?: Date;
      format?: {
        toDisplay: (date: Date) => string;
        toValue: (date: string) => Date;
      };
    }): JQuery;
  }
}
