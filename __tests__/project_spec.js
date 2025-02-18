const { v4: uuidv4 } = require('uuid');
const prettier = require('prettier');
const project = require('../src/project');
const fileService = require('../src/fileService');
jest.mock('uuid');
jest.mock('../src/fileService');

describe('project', function () {
  beforeEach(() => {
    this.aut = new project();
    this.options = {
      srcPath: 'path/',
      uuid: '12345',
      country: 'PH',
      projectName: 'someproject',
      projectPath: 'path/'
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('project.constructor > expect > uuid and fs is initialized', () => {
    new project();
    expect(fileService).toBeCalled();
    expect(uuidv4).toBeCalled();
    uuidv4.mockClear();
    fileService.mockClear();
  });

  test('project.createUUIDFile > expect > uuid file is created', () => {
    jest
      .spyOn(fileService.prototype, 'createFile')
      .mockImplementation(() => {});
    const path = 'path';
    const uuid = '1234567890';
    this.aut.createUUIDFile(path, uuid);
    expect(fileService.prototype.createFile).toHaveBeenCalledWith(path + uuid);
  });

  test('project.createComponents > expect > opts are correct', () => {
    jest
      .spyOn(project.prototype, 'createFileFromTemplate') 
      .mockImplementation(() => {});
   this.aut.createComponents(this.options);
    expect(project.prototype.createFileFromTemplate).toHaveBeenCalledWith({
      srcFile: 'SDFInstaller.js',
      filename: 'someproject_installer.js',
      folder: this.options.srcPath + 'components/',
      replaceContents: [[/UUID/g, this.options.uuid]]
    });
  });

  test('project.createBundleRecord > expect > opts are correct', () => {
    jest
      .spyOn(project.prototype, 'createFileFromTemplate')
      .mockImplementation(() => {});
    const filename = 'str_localized_bundle.json';
    this.aut.createBundleRecord(this.options);
    expect(project.prototype.createFileFromTemplate).toHaveBeenCalledWith({
      srcFile: filename,
      filename: filename,
      folder: this.options.srcPath + 'records/',
      replaceContents: [
        [/UUID/g, this.options.uuid],
        [/COUNTRY/g, this.options.country],
        [/PROJECT/g, this.options.projectName]
      ]
    });
  });

  test('project.createObjects > expect > opts are correct', () => {
    jest
      .spyOn(project.prototype, 'createFileFromTemplate')
      .mockImplementation(() => {});
    this.aut.createObjects(this.options);
    expect(project.prototype.createFileFromTemplate).toHaveBeenCalledWith({
      srcFile: 'customscript_sdfinstaller.xml',
      filename: 'customscript_someproject_installer.xml',
      folder: this.options.projectPath + 'Objects/',
      replaceContents: [
        [/UUID/g, this.options.uuid],
        [/COUNTRY/g, this.options.country],
        [/PROJECT/g, this.options.projectName]
      ]
    });
  });

  test('project.createDeploySuiteApp > expect > opts are correct', () => {
    jest
      .spyOn(project.prototype, 'createFileFromTemplate')
      .mockImplementation(() => {});
    const files = ['deploy.xml', 'manifest.xml'];
    this.aut.createDeploySuiteApp(this.options);
    files.forEach((file) => {
      expect(project.prototype.createFileFromTemplate).toHaveBeenCalledWith({
        srcFile: 'suiteapp/' + file,
        filename: file,
        folder: this.options.projectPath,
        replaceContents: [
          [/UUID/g, this.options.uuid],
          [/COUNTRY/g, this.options.country],
          [/PROJECT/g, this.options.projectName]
        ]
      });
    });
  });

  test('project.createDeployAccountCustomization > expect > opts are correct', () => {
    jest
      .spyOn(project.prototype, 'createFileFromTemplate')
      .mockImplementation(() => {});
    const files = ['deploy.xml', 'manifest.xml'];
    this.aut.createDeployAccountCustomization(this.options);
    files.forEach((file) => {
      expect(project.prototype.createFileFromTemplate).toHaveBeenCalledWith({
        srcFile: 'accountcustomization/' + file,
        filename: file,
        folder: this.options.projectPath,
        replaceContents: [
          [/UUID/g, this.options.uuid],
          [/COUNTRY/g, this.options.country],
          [/PROJECT/g, this.options.projectName]
        ]
      });
    });
  });

  test('project.createFileFromTemplate > expect > createFile', () => {
    jest.spyOn(fileService.prototype, 'readFile').mockImplementation(() => {
      return 'UUID';
    });
    jest
      .spyOn(fileService.prototype, 'createFolder')
      .mockImplementation(() => {});
    jest.spyOn(project.prototype, 'formatFile').mockImplementation((a, b) => {
      return b;
    });
    jest
      .spyOn(fileService.prototype, 'createFile')
      .mockImplementation(() => {});

    this.options.srcFile = 'file.js';
    this.options.folder = 'folder/';
    this.options.filename = 'file.js';
    this.options.replaceContents = [[/UUID/g, this.options.uuid]];
    var expected = '12345';

    this.aut.createFileFromTemplate(this.options).then(() => {
      expect(fileService.prototype.readFile).toHaveBeenCalledWith(
        './templates/' + this.options.srcFile
      );
      expect(fileService.prototype.createFolder).toHaveBeenCalledWith(
        this.options.folder
      );
      expect(project.prototype.formatFile).toBeCalledWith(
        this.options,
        expected
      );
      expect(fileService.prototype.createFile).toBeCalledWith(
        this.options.folder + this.options.filename,
        expected
      );
    });
  });

  test('project.formatFile > expect > format contents', () => {
    jest.spyOn(prettier, 'format').mockImplementation((a) => {
      return a.trim();
    });
    const input = '     abc      ';
    const expected = 'abc';
    this.options.filename = 'file.js';
    const formatterOptions = {
      tabWidth: 4,
      semi: true,
      singleQuote: true,
      printWidth: 120,
      bracketSpacing: true,
      endOfLine: 'lf',
      parser: 'babel'
    };
    expect(this.aut.formatFile(this.options, input)).toEqual(expected);
    expect(prettier.format).toBeCalledWith(input, formatterOptions);

    this.options.filename = 'file.json';
    formatterOptions.parser = 'json';
    this.aut.formatFile(this.options, input);
    expect(prettier.format).toBeCalledWith(input, formatterOptions);
  });

  test('project.create sdfProjectType is SuiteApp > expect > create folder and files and call createDeploySuiteApp', () => {
    jest
      .spyOn(fileService.prototype, 'createFolder')
      .mockImplementation(() => {});
    jest
      .spyOn(project.prototype, 'createUUIDFile')
      .mockImplementation(() => {});
    jest
      .spyOn(project.prototype, 'createComponents')
      .mockImplementation(() => {});
    jest
      .spyOn(project.prototype, 'createBundleRecord')
      .mockImplementation(() => {});
    jest.spyOn(project.prototype, 'createObjects').mockImplementation(() => {});
    jest.spyOn(project.prototype, 'createDeploySuiteApp').mockImplementation(() => {});
    this.options.sdfProjectType = 'SuiteApp'
    this.options.sdfProjectFolder = 'SuiteApps'
    this.aut.create(this.options).then(() => {
      expect(fileService.prototype.createFolder).toHaveBeenCalledWith(
        this.options.projectPath
      );
      expect(fileService.prototype.createFolder).toHaveBeenCalledWith(
        this.options.srcPath
      );
      expect(project.prototype.createUUIDFile).toHaveBeenCalledWith(
        this.options.fileCabinetPath,
        this.aut._uuid
      );
      expect(project.prototype.createComponents).toHaveBeenCalledWith(
        this.options
      );
      expect(project.prototype.createBundleRecord).toHaveBeenCalledWith(
        this.options
      );
      expect(project.prototype.createObjects).toHaveBeenCalledWith(
        this.options
      );
      expect(project.prototype.createDeploySuiteApp).toHaveBeenCalledWith(this.options);
    });
  });

  test('project.create sdfProjectType is Account Customization > expect > create folder and files and call createDeployAccountCustomization', () => {
    jest
      .spyOn(fileService.prototype, 'createFolder')
      .mockImplementation(() => {});
    jest
      .spyOn(project.prototype, 'createUUIDFile')
      .mockImplementation(() => {});
    jest
      .spyOn(project.prototype, 'createBundleRecord')
      .mockImplementation(() => {});
    jest.spyOn(project.prototype, 'createDeployAccountCustomization').mockImplementation(() => {});
    this.options.sdfProjectType = 'Account Customization'
    this.options.sdfProjectFolder = 'SuiteScripts'
    this.aut.create(this.options).then(() => {
      expect(fileService.prototype.createFolder).toHaveBeenCalledWith(
        this.options.projectPath
      );
      expect(fileService.prototype.createFolder).toHaveBeenCalledWith(
        this.options.srcPath
      );
      expect(fileService.prototype.createFolder).toHaveBeenCalledWith(
        this.options.srcPath + 'components/'
      );
      expect(fileService.prototype.createFolder).toHaveBeenCalledWith(
        this.options.projectPath  + 'Objects/'
      );
      expect(project.prototype.createUUIDFile).toHaveBeenCalledWith(
        this.options.fileCabinetPath,
        this.aut._uuid
      );
      expect(project.prototype.createBundleRecord).toHaveBeenCalledWith(
        this.options
      );
      expect(project.prototype.createDeployAccountCustomization).toHaveBeenCalledWith(this.options);
    });
  });
});
