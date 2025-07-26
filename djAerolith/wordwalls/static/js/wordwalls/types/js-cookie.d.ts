declare module 'js-cookie' {
  interface CookiesStatic {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: object): void;
    remove(name: string, options?: object): void;
  }

  const Cookies: CookiesStatic;
  export = Cookies;
}
