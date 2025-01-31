import * as assert from 'assert';
import * as sinon from 'sinon';
import * as fs from 'fs';
import appInsights from '../../../appInsights';
import auth from '../../../Auth';
import { Cli, Logger } from '../../../cli';
import Command, { CommandError } from '../../../Command';
import { sinonUtil } from '../../../utils';
import * as open from 'open';
import commands from '../commands';
const command: Command = require('./app-open');

describe(commands.OPEN, () => {
  let log: string[];
  let logger: Logger;
  let cli: Cli;
  let openStub: sinon.SinonStub;
  let getSettingWithDefaultValueStub: sinon.SinonStub;
  let loggerLogSpy: sinon.SinonSpy;

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(appInsights, 'trackEvent').callsFake(() => { });
    auth.service.connected = true;
    sinon.stub(fs, 'existsSync').callsFake(() => true);
    sinon.stub(fs, 'readFileSync').callsFake(() => JSON.stringify({
      "apps": [
        {
          "appId": "9b1b1e42-794b-4c71-93ac-5ed92488b67f",
          "name": "CLI app1"
        }
      ]
    }));
  });

  beforeEach(() => {
    log = [];
    cli = Cli.getInstance();
    logger = {
      log: (msg: string) => {
        log.push(msg);
      },
      logRaw: (msg: string) => {
        log.push(msg);
      },
      logToStderr: (msg: string) => {
        log.push(msg);
      }
    };
    loggerLogSpy = sinon.spy(logger, 'log');
    (command as any)._open = open;
    openStub = sinon.stub(command as any, '_open').callsFake(() => Promise.resolve(null));
    getSettingWithDefaultValueStub = sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((() => false));
  });

  afterEach(() => {    
    openStub.restore();
    getSettingWithDefaultValueStub.restore();
  });

  after(() => {
    sinonUtil.restore([
      auth.restoreAuth,
      appInsights.trackEvent,
      fs.existsSync,
      fs.readFileSync
    ]);
    auth.service.connected = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.OPEN), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if the appId is not a valid guid', () => {
    const actual = command.validate({ options: { appId: 'abc' } });
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if valid appId-guid is specified', () => {
    const actual = command.validate({ options: { appId: '9b1b1e42-794b-4c71-93ac-5ed92488b67f' } });
    assert.strictEqual(actual, true);
  });

  // it('handles error when the app specified with the appId not found', (done) => {
  //   sinonUtil.restore([ request.get ]);
  //   sinon.stub(request, 'get').callsFake(opts => {
  //     if (opts.url === `https://graph.microsoft.com/v1.0/myorganization/applications?$filter=appId eq '9b1b1e42-794b-4c71-93ac-5ed92488b67f'&$select=id`) {
  //       return Promise.resolve({ value: [] });
  //     }

  //     return Promise.reject(`Invalid request ${JSON.stringify(opts)}`);
  //   });

  //   command.action(logger, {
  //     options: {
  //       debug: false,
  //       appId: '9b1b1e42-794b-4c71-93ac-5ed92488b67f'
  //     }
  //   }, (err?: any) => {
  //     try {
  //       assert.strictEqual(err.message, `No Azure AD application registration with ID 9b1b1e42-794b-4c71-93ac-5ed92488b67f found`);
  //       done();
  //     }
  //     catch (e) {
  //       done(e);
  //     }
  //   });
  // });

  // it('handles error when retrieving information about app through appId failed', (done) => {
  //   sinonUtil.restore([ request.get ]);
  //   sinon.stub(request, 'get').callsFake(_ => Promise.reject('An error has occurred'));

  //   command.action(logger, {
  //     options: {
  //       debug: false,
  //       appId: '9b1b1e42-794b-4c71-93ac-5ed92488b67f'
  //     }
  //   }, (err?: any) => {
  //     try {
  //       assert.strictEqual(err.message, `An error has occurred`);
  //       done();
  //     }
  //     catch (e) {
  //       done(e);
  //     }
  //   });
  // });

  it('supports debug mode', () => {
    const options = command.options();
    let containsOption = false;
    options.forEach(o => {
      if (o.option === '--debug') {
        containsOption = true;
      }
    });
    assert(containsOption);
  });

  it('shows message with url when the app specified with the appId is found', (done) => {
    const appId = "9b1b1e42-794b-4c71-93ac-5ed92488b67f";
    command.action(logger, {
      options: {
        debug: false,
        appId: appId
      }
    }, (err?: any) => {
      try {
        assert(loggerLogSpy.calledWith(`Use a web browser to open the page https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/Overview/appId/${appId}/isMSAApp/`));
        assert.strictEqual(err, undefined);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('shows message with url when the app specified with the appId is found (verbose)', (done) => {
    const appId = "9b1b1e42-794b-4c71-93ac-5ed92488b67f";
    command.action(logger, {
      options: {
        debug: false,
        verbose: true,
        appId: appId
      }
    }, (err?: any) => {
      try {
        assert(loggerLogSpy.calledWith(`Use a web browser to open the page https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/Overview/appId/${appId}/isMSAApp/`));
        assert.strictEqual(err, undefined);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });
  
  it('shows message with preview-url when the app specified with the appId is found', (done) => {
    const appId = "9b1b1e42-794b-4c71-93ac-5ed92488b67f";
    command.action(logger, {
      options: {
        debug: false,
        appId: appId,
        preview: true
      }
    }, (err?: any) => {
      try {        
        assert(loggerLogSpy.calledWith(`Use a web browser to open the page https://preview.portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/Overview/appId/${appId}/isMSAApp/`));
        assert.strictEqual(err, undefined);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('shows message with url when the app specified with the appId is found (using autoOpenInBrowser)', (done) => {
    getSettingWithDefaultValueStub.restore();
    getSettingWithDefaultValueStub = sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((() => true));

    const appId = "9b1b1e42-794b-4c71-93ac-5ed92488b67f";
    command.action(logger, {
      options: {
        debug: false,
        appId: appId
      }
    }, (err?: any) => {
      try {
        assert(loggerLogSpy.calledWith(`Opening the following page in your browser: https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/Overview/appId/${appId}/isMSAApp/`));
        assert.strictEqual(err, undefined);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('shows message with preview-url when the app specified with the appId is found (using autoOpenInBrowser)', (done) => {
    getSettingWithDefaultValueStub.restore();
    getSettingWithDefaultValueStub = sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((() => true));

    const appId = "9b1b1e42-794b-4c71-93ac-5ed92488b67f";
    command.action(logger, {
      options: {
        debug: false,
        appId: appId,
        preview: true
      }
    }, (err?: any) => {
      try {        
        assert(loggerLogSpy.calledWith(`Opening the following page in your browser: https://preview.portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/Overview/appId/${appId}/isMSAApp/`));
        assert.strictEqual(err, undefined);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('throws error when open in browser fails', (done) => {
    openStub.restore();
    openStub = sinon.stub(command as any, '_open').callsFake(() => Promise.reject("An error occurred"));
    getSettingWithDefaultValueStub.restore();
    getSettingWithDefaultValueStub = sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((() => true));

    const appId = "9b1b1e42-794b-4c71-93ac-5ed92488b67f";
    command.action(logger, {
      options: {
        debug: false,
        appId: appId,
        preview: true
      }
    }, (err?: any) => {
      try {        
        assert(loggerLogSpy.calledWith(`Opening the following page in your browser: https://preview.portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/Overview/appId/${appId}/isMSAApp/`));
        assert.strictEqual(
          JSON.stringify(err),
          JSON.stringify(new CommandError("An error occurred"))
        );
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });
});