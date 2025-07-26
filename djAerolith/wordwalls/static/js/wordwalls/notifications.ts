import * as bootbox from 'bootbox';

type AlertSize = 'small' | 'large' | 'extra-large';

class Notifications {
  static alert(title: string, message: string, size?: AlertSize): void {
    const displaySize = size || 'large';
    bootbox.alert({
      size: displaySize,
      title,
      message,
    });
  }

  static confirm(title: string, message: string, callback: () => void): void {
    bootbox.confirm({
      title,
      message,
      callback: (confirmed: boolean) => {
        if (confirmed) {
          callback();
        }
      },
    });
  }
}

export default Notifications;
