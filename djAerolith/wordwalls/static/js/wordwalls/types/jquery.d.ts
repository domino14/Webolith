declare module 'jquery' {
  interface JQueryEventObject {
    date?: Date;
    preventDefault?(): void;
  }

  interface JQuery<TElement = HTMLElement> {
    parents(selector?: string): JQuery<TElement>;
    on(
      events: string,
      handler: (this: TElement, eventObject: JQueryEventObject) => void,
    ): JQuery<TElement>;
    on(
      events: string,
      selector: string,
      handler: (this: TElement, eventObject: JQueryEventObject) => void,
    ): JQuery<TElement>;
    off(events?: string): JQuery<TElement>;
    children(selector?: string): JQuery<TElement>;
    addClass(className: string): JQuery<TElement>;
    removeClass(className: string): JQuery<TElement>;
    position(): JQuery.Coordinates;
    height(): number;
    modal(action?: string): JQuery<TElement>;
    ajaxSend(
      handler: (event: Event, xhr: XMLHttpRequest, settings: object) => void,
    ): JQuery<TElement>;
    datepicker(options?: object): JQuery<TElement>;
  }

  namespace JQuery {
    interface Coordinates {
      top: number;
      left: number;
    }
  }

  interface JQueryStatic {
    (selector: string | Element | Document | JQuery | (() => void)): JQuery;
    (html: string, ownerDocument?: Document): JQuery;
    (element: Element): JQuery;
    ajax(settings: object): Promise<unknown>;
    trim(str: string): string;
  }

  const $: JQueryStatic;
  export = $;
}
