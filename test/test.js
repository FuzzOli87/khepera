import test from 'ava';
import path from 'path';
import getStream from 'get-stream';
import childProcess from 'child_process';

const cliPath = path.join(__dirname, '../dist/cli.js');
const toArray = val => {
  if (val === null || val === undefined) {
    return [];
  }

  return Array.isArray(val) ? val : [val];
};

const concatPath = (dirname, concactees) => (
  [path.relative(dirname, cliPath)].concat(toArray(concactees))
);

function execCli(args) {
  const dirname = __dirname;
  const env = {};

  let stdout;
  let stderr;

  const processPromise = new Promise(resolve => {
    const child = childProcess.spawn(process.execPath, concatPath(dirname, args), {
      cwd: dirname,
      env,
      stdio: [null, 'pipe', 'pipe']
    });

    child.on('close', (code, signal) => {
      if (code) {
        const err = new Error(`test-worker exited with a non-zero exit code: ${code}`);

        err.code = code;
        err.signal = signal;
        resolve(err);

        return;
      }

      resolve(code);
    });

    stdout = getStream(child.stdout);
    stderr = getStream(child.stderr);
  });

  return Promise.all([processPromise, stdout, stderr]);
}

test('Disallow invalid configurations', async t => {
  t.plan(2);

  const [err, stdout] = await execCli(['-p', 'fixtures/.basefactory']);

  t.truthy(err, 'Properly throws out an error since we exited process');
  t.is(stdout, 'Invalid .setupizerc configuration file\n', 'Does not throw error text');
});
