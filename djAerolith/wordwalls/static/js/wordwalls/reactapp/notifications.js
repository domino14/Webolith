import bootbox from 'bootbox';

class Notifications {
  static alert(size, title, message) {
    bootbox.alert({
      size, title, message,
    });
  }
}

export default Notifications;
