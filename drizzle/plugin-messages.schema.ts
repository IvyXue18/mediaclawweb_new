// Deliberately export only the two new tables. The existing production schema
// predates this migration stream and must not be recreated or baselined here.
export {
  pluginMessage,
  pluginMessageReceipt,
} from '../src/config/db/schema.postgres';
