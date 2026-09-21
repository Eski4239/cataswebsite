// Backups — a git tag (restore point) plus a zip of the whole site sent to Telegram (a copy outside GitHub/Vercel).
import {createTag, downloadZip, listTags} from './github';
import {sendDocument} from './telegram';

export async function createBackup(chatIds: number[]): Promise<string> {
  const date = new Date().toISOString().slice(0, 10);
  const existing = await listTags(`backup-${date}`);
  const name = existing.length ? `backup-${date}-${existing.length + 1}` : `backup-${date}`;
  const sha = await createTag(name);
  const zip = await downloadZip();
  for (const id of chatIds) await sendDocument(id, zip, `${name}.zip`, `Website backup ${date} (restore point: git tag ${name}, commit ${sha.slice(0, 7)})`);
  return name;
}

export const listBackups = () => listTags('backup-');
