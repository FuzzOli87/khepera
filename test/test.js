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

function execCli({ args = [], options = {} } = {}) {
  const dirname = __dirname;
  const { env = {} } = options;

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

test('exit with error if HOME environment variable not available', async t => {
  t.plan(2);

  const [err, stdout] = await execCli();

  t.truthy(err, 'Properly throws out an error since we exited process');
  t.is(stdout, 'HOME env variable not available, check configuration\n',
       'Does not throw error text');
});

test('exit with error if configuration file not found in HOME directory', async t => {
  t.plan(2);

  const options = {
    env: {
      HOME: path.resolve(__dirname, 'fixtures/noconfig')
    }
  };

  const [err, stdout] = await execCli({ options });

  t.truthy(err, 'Properly throws out an error since we exited process');
  t.is(stdout, 'No .kheperarc file found in home directory\n', 'Does not throw error text');
});
