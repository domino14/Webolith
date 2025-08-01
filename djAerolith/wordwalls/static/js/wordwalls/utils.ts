class Utils {
  /**
   * Take `str` which may contain symbols such as 1, 2, 3 and return
   * the string with the proper digraphs.
   */
  static displaySpanishDigraphs(str: string): string {
    return str.replace(/1/g, 'ᴄʜ').replace(/2/g, 'ʟʟ').replace(/3/g, 'ʀʀ');
  }

  /**
   * Set up CSRF with ajax - now handled by ajax_utils.ts
   * This method is kept for compatibility but does nothing
   */
  static setupCsrfAjax(): void {
    // CSRF is now handled automatically by ajax_utils.ts
  }
}

export default Utils;
