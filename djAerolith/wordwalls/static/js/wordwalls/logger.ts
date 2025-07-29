import { ajaxUtils } from './ajax_utils';

const log = (obj: unknown): void => {
  ajaxUtils.postJson('/wordwalls/log/', { data: obj }).catch(() => {
    // Ignore logging errors
  });
};

export default log;
