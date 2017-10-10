import $ from 'jquery';

class Utils {
  /**
   * Take `str` which may contain symbols such as 1, 2, 3 and return
   * the string with the proper digraphs.
   * @param  {string} str
   * @return {string}
   */
  static displaySpanishDigraphs(str) {
    return str.replace(/1/g, 'ᴄʜ').replace(/2/g, 'ʟʟ').replace(/3/g, 'ʀʀ');
  }

  /**
   * Set up CSRF with ajax.
   */
  static setupCsrfAjax() {
    $(document).ajaxSend((event, xhr, settings) => {
      function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
          const cookies = document.cookie.split(';');
          for (let i = 0; i < cookies.length; i += 1) {
            const cookie = $.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === `${name}=`) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
            }
          }
        }
        return cookieValue;
      }

      function sameOrigin(url) {
        // url could be relative or scheme relative or absolute
        const { host, protocol } = document.location; // host + port
        const srOrigin = `//${host}`;
        const origin = protocol + srOrigin;
        // Allow absolute or scheme relative URLs to same origin
        return (url === origin || url.slice(0, origin.length + 1) === `${origin}/`) ||
          (url === srOrigin || url.slice(0, srOrigin.length + 1) === `${srOrigin}/`) ||
          // or any other URL that isn't scheme relative or absolute i.e relative.
          !(/^(\/\/|http:|https:).*/.test(url));
      }

      function safeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
      }

      if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
        xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
      }
    });
  }
}

export default Utils;
