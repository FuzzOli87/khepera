import test from 'ava';
import path from 'path';
import fs from 'fs';
import getStream from 'get-stream';
import childProcess from 'child_process';

const cliPath = path.join(__dirname, '../dist/bin/cli');
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
      HOME: path.resolve(__dirname, 'fixtures/no_config')
    }
  };

  const [err, stdout] = await execCli({ options });

  t.truthy(err, 'Properly throws out an error since we exited process');
  t.is(stdout, 'No .kheperarc file found in home directory\n', 'Does not throw error text');
});

test('Create base project', async t => {
  t.plan(9);

  const testProject = 'test-project';
  const testProjectPath = `./fixtures/projects/${testProject}`;
  const testMainFilePath = `${testProjectPath}/index.js`;
  const testPkgJsonPath = `${testProjectPath}/package.json`;
  const testSrcDirPath = `${testProjectPath}/src`;
  const testLibDirPath = `${testProjectPath}/src/lib`;
  const testLibFilePath = `${testProjectPath}/src/lib/testLib.js`;
  const testSrcFilePath = `${testProjectPath}/src/testSrc.js`;
  const stdOutExpected = `Base Project ${testProjectPath} created!\n`;
  const options = {
    env: {
      HOME: path.resolve(__dirname, 'fixtures/config')
    }
  };
  const args = [testProject];
  const [err, stdout] = await execCli({ args, options });

  t.truthy(err, 'Properly throws out an error since we exited process');
  t.is(stdout, stdOutExpected, 'Gives out proper successful create message');

  fs.stat(testProjectPath, (errProj, stat) => {
    if (errProj) {
      t.fail('Error: Project directory not created');
    } else {
      t.true(stat.isDirectory(), 'Creates');
    }
  });

  fs.stat(testMainFilePath, (errProj, stat) => {
    if (errProj) {
      t.fail('Error: Main index.js not created');
    } else {
      t.true(stat.isFile(), 'Creates main file index.js');
    }
  });

  fs.stat(testPkgJsonPath, (errProj, stat) => {
    if (errProj) {
      t.fail('Error: package.json not created');
    } else {
      t.true(stat.isFile(), 'Creates package.json file');

      fs.readFile(testPkgJsonPath, (errPkgJson, pkgFile) => {
        if (errPkgJson) {
          t.fail('Error: Couldn\'t load package.json file');
        }
        const expectedPkgJson = {
          name: 'test-project',
          version: '0.1.0',
          description: 'test project thingy',
          main: 'index.js',
          author: 'test guy',
          licence: 'Apache-2.0',
          devDependencies: {
            notarealpackage: '^0.1.0'
          },
          dependencies: {
            notarealpackage: '^0.1.0'
          }
        };

        const packageJSON = JSON.parse(pkgFile);

        t.deepEqual(packageJSON, expectedPkgJson, 'package.json has the right content');
      });
    }
  });

  fs.stat(testSrcDirPath, (errProj, stat) => {
    if (errProj) {
      t.fail('Error: src directory not created');
    } else {
      t.true(stat.isDirectory(), 'Creates src directory');
    }
  });

  fs.stat(testSrcDirPath, (errProj, stat) => {
    if (errProj) {
      t.fail('Error: src directory not created');
    } else {
      t.true(stat.isDirectory(), 'Creates src directory');
    }
  });

  fs.stat(testSrcFilePath, (errProj, stat) => {
    if (errProj) {
      t.fail('Error: src/testSrc.js file not created');
    } else {
      t.true(stat.isFile(), 'Creates src/testSrc.js file');
    }
  });

  fs.stat(testLibDirPath, (errProj, stat) => {
    if (errProj) {
      t.fail('Error: src/lib directory not created');
    } else {
      t.true(stat.isDirectory(), 'Creates src/lib directory');
    }
  });

  fs.stat(testLibFilePath, (errProj, stat) => {
    if (errProj) {
      t.fail('Error: src/lib/testLib.js file not created');
    } else {
      t.true(stat.isFile(), 'Creates src/lib/testLib.js file');
    }
  });
});
