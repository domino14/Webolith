import $ from 'jquery';

const log = (obj: unknown): void => {
  $.ajax({
    url: '/wordwalls/log/',
    data: JSON.stringify(obj),
    method: 'POST',
    contentType: 'application/json; charset=utf-8',
  });
};

export default log;
