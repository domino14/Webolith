import bootbox from 'bootbox';

class Notifications {
  static alert(title, message, size) {
    let displaySize = 'large';
    if (size) {
      displaySize = size;
    }
    bootbox.alert({
      displaySize, title, message,
    });
  }

  static confirm(title, message, callback) {
    bootbox.confirm({
      title, message, callback: (confirmed) => { if (confirmed) { callback(); } },
    });
  }
}

export default Notifications;
