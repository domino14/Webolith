import bootbox from 'bootbox';

class Notifications {
  static alert(size, title, message) {
    bootbox.alert({
      size, title, message,
    });
  }

  static confirm(title, message, callback) {
    bootbox.confirm({
      title, message, callback: (confirmed) => { if (confirmed) { callback(); } },
    });
  }
}

export default Notifications;
