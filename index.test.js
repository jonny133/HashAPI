const { hasher, validateInput } = require('./routes/hasher');
const fs = require('fs');

const EMPTY_LARGE_FILE = '1gig.zero.file';

beforeAll(() => {
  // Check empty files don't already exist
  if (fs.existsSync(EMPTY_LARGE_FILE)) {
    fs.unlink(EMPTY_LARGE_FILE, err => {
      if (err) throw err;
    });
  }
});

describe('Joi validation', () => {
  it('validates a correct algorithm  and filepath', () => {
    const validInput = validateInput('md4', './testFile.txt');
    // const validInput = validateInput('md5', './testFile.txt');
    expect(validInput.error).toBeNull();
  });
  it('validates use of other correct algorithm', () => {
    // const validAlg = validateInput('sha256', './testFile.txt');
    const validAlg = validateInput('sha1', './testFile.txt');
    expect(validAlg.error).toBeNull();
  });

  it('rejects an unsupported algorithm', () => {
    const invalidAlg = validateInput('ripemd160', './testFile.txt');
    expect(invalidAlg.error).not.toBeNull();
  });
  it('rejects a blatantly wrong filepath', () => {
    const invalidPath = validateInput('md4', 'www.google.com');
    // const invalidPath = validateInput('md5', 'www.google.com');
    expect(invalidPath.error).not.toBeNull();
  });
});

describe('hasher() function produces expected hashes of testFile.txt', () => {
  // Expect an md5 hash of testFile.txt to return 01aad0e51fcd5582b307613842e4ffe5
  it('produces the expected md5 hash', async done => {
    const md5Hash = await hasher('md5', './testFile.txt');
    expect(md5Hash).toBe('01aad0e51fcd5582b307613842e4ffe5');
    done();
  });
  // Expect a sha256 hash of testFile.txt to return 7321348c8894678447b54c888fdbc4e4b825bf4d1eb0cfb27874286a23ea9fd2 (lowercase hex)
  it('produces the expected sha256 hash', async done => {
    const sha256Hash = await hasher('sha256', './testFile.txt');
    expect(sha256Hash).toBe(
      '7321348c8894678447b54c888fdbc4e4b825bf4d1eb0cfb27874286a23ea9fd2',
    );
    done();
  });
});

jest.setTimeout(60000);
describe('hasher handles large file', async () => {
  it('hashes a 1gb file', async done => {
    const create1GBFile = () => {
      return new Promise((resolve, reject) => {
        fs.writeFile(EMPTY_LARGE_FILE, new Buffer.alloc(1024 ** 3 - 1), () => {
          fs.appendFile(EMPTY_LARGE_FILE, new Buffer.alloc(1), () => {
            resolve('1gb dummy file created');
          });
        });
      });
    };
    try {
      await create1GBFile();
    } catch (err) {
      throw err;
    }
    try {
      const md5Hash = await hasher('md5', EMPTY_LARGE_FILE);
      expect(md5Hash).toBe('cd573cfaace07e7949bc0c46028904ff');
    } catch (err) {
      throw err;
    }
    done();
  });
});

afterAll(() => {
  // Delete dummy files - avoid pollution
  try {
    fs.unlink(EMPTY_LARGE_FILE, err => {
      if (err) throw err;
    });
  } catch (err) {
    console.log(err);
  }
});
