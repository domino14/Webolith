import $ from 'jquery';

const log = (obj) => {
  $.ajax({
    url: '/wordwalls/log/',
    data: JSON.stringify(obj),
    method: 'POST',
    contentType: 'application/json; charset=utf-8',
  });
};

export default log;
