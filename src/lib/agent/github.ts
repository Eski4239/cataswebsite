// GitHub helpers — the agent stores content by committing to the repo; Vercel redeploys on push.
const API = 'https://api.github.com';

function cfg() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set');
  return {
    token,
    repo: process.env.GITHUB_REPO || 'Eski4239/cataswebsite',
    branch: process.env.GITHUB_BRANCH || 'main'
  };
}

async function gh<T>(path: string, init?: RequestInit): Promise<T> {
  const {token, repo} = cfg();
  const res = await fetch(`${API}/repos/${repo}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...init?.headers
    }
  });
  if (!res.ok) throw new Error(`GitHub ${init?.method ?? 'GET'} ${path} -> ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

/** Read and parse a JSON file from the latest commit on the content branch. */
export async function readJson<T>(path: string): Promise<T> {
  const {branch} = cfg();
  const file = await gh<{content: string}>(`/contents/${path}?ref=${branch}`);
  return JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')) as T;
}

export type FileChange = {path: string; content: string | Buffer | null}; // null = delete

/** Commit several file changes atomically as one commit. Returns the new commit sha. */
export async function commitFiles(message: string, files: FileChange[]): Promise<string> {
  const {branch} = cfg();
  const ref = await gh<{object: {sha: string}}>(`/git/ref/heads/${branch}`);
  const head = await gh<{tree: {sha: string}}>(`/git/commits/${ref.object.sha}`);

  const tree = await Promise.all(
    files.map(async (f) => {
      if (f.content === null) return {path: f.path, mode: '100644', type: 'blob', sha: null};
      const buf = typeof f.content === 'string' ? Buffer.from(f.content, 'utf8') : f.content;
      const blob = await gh<{sha: string}>('/git/blobs', {
        method: 'POST',
        body: JSON.stringify({content: buf.toString('base64'), encoding: 'base64'})
      });
      return {path: f.path, mode: '100644', type: 'blob', sha: blob.sha};
    })
  );

  const newTree = await gh<{sha: string}>('/git/trees', {
    method: 'POST',
    body: JSON.stringify({base_tree: head.tree.sha, tree})
  });
  const commit = await gh<{sha: string}>('/git/commits', {
    method: 'POST',
    body: JSON.stringify({message, tree: newTree.sha, parents: [ref.object.sha]})
  });
  await gh(`/git/refs/heads/${branch}`, {method: 'PATCH', body: JSON.stringify({sha: commit.sha})});
  return commit.sha;
}

/**
 * Undo the latest commit, but only if it is an agent commit (message starts with "agent:")
 * and, when `expectSha` is given, only if it is still the head. Creates a new commit that
 * restores the parent's tree, so history is preserved.
 */
export async function undoHead(expectSha?: string): Promise<{ok: true; sha: string; undone: string} | {ok: false; reason: string}> {
  const {branch} = cfg();
  const ref = await gh<{object: {sha: string}}>(`/git/ref/heads/${branch}`);
  const head = await gh<{message: string; parents: {sha: string}[]}>(`/git/commits/${ref.object.sha}`);
  if (expectSha && !ref.object.sha.startsWith(expectSha)) {
    return {ok: false, reason: 'Something else has changed since then, so I cannot safely undo that.'};
  }
  if (!head.message.startsWith('agent:')) {
    return {ok: false, reason: 'The latest change was not made by me, so I will not undo it.'};
  }
  const parent = await gh<{tree: {sha: string}}>(`/git/commits/${head.parents[0].sha}`);
  const commit = await gh<{sha: string}>('/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message: `agent: undo "${head.message.split('\n')[0].slice(0, 60)}"`,
      tree: parent.tree.sha,
      parents: [ref.object.sha]
    })
  });
  await gh(`/git/refs/heads/${branch}`, {method: 'PATCH', body: JSON.stringify({sha: commit.sha})});
  return {ok: true, sha: commit.sha, undone: head.message.split('\n')[0]};
}

/** Create a lightweight tag (used for backup restore points) at the current head of the content branch. */
export async function createTag(name: string): Promise<string> {
  const {branch} = cfg();
  const ref = await gh<{object: {sha: string}}>(`/git/ref/heads/${branch}`);
  await gh('/git/refs', {method: 'POST', body: JSON.stringify({ref: `refs/tags/${name}`, sha: ref.object.sha})});
  return ref.object.sha;
}

export async function listTags(prefix: string): Promise<string[]> {
  const refs = await gh<{ref: string}[]>(`/git/matching-refs/tags/${prefix}`);
  return refs.map((r) => r.ref.replace('refs/tags/', '')).sort();
}

/** Zip of the whole repository (source, content, images) at the head of the content branch. */
export async function downloadZip(): Promise<Buffer> {
  const {token, repo, branch} = cfg();
  const res = await fetch(`${API}/repos/${repo}/zipball/${branch}`, {
    headers: {Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json'},
    redirect: 'follow'
  });
  if (!res.ok) throw new Error(`GitHub zipball -> ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
