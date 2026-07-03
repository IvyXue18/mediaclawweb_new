import { migrationPending } from '../../pending';

export function getAllConfigs() {
  return migrationPending('config.getAllConfigs');
}
