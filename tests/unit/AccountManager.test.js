const { expect } = require('chai');
const sinon = require('sinon');
const AccountManager = require('../../src/lib/AccountManager');

describe('AccountManager', () => {
  let accountManager;

  beforeEach(() => {
    accountManager = new AccountManager();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('loadAccounts', () => {
    it('should load accounts from config file', async () => {
      const mockConfig = {
        accounts: [
          {
            id: 'account1',
            token: 'test-token',
            proxy: 'http://proxy:8080'
          }
        ]
      };

      // Mock the config loading
      sinon.stub(accountManager, 'loadConfig').returns(mockConfig);

      await accountManager.loadAccounts();
      const account = accountManager.getAccount('account1');
      
      expect(account).to.exist;
      expect(account.id).to.equal('account1');
      expect(account.token).to.equal('test-token');
      expect(account.proxy).to.equal('http://proxy:8080');
    });

    it('should handle empty config', async () => {
      sinon.stub(accountManager, 'loadConfig').returns({ accounts: [] });
      
      await accountManager.loadAccounts();
      const accounts = accountManager.getAllAccounts();
      
      expect(accounts).to.be.an('array');
      expect(accounts).to.have.length(0);
    });
  });

  describe('getAccount', () => {
    it('should return account by id', async () => {
      const mockAccount = {
        id: 'account1',
        token: 'test-token'
      };

      accountManager.accounts.set('account1', mockAccount);
      const account = accountManager.getAccount('account1');
      
      expect(account).to.deep.equal(mockAccount);
    });

    it('should return null for non-existent account', () => {
      const account = accountManager.getAccount('non-existent');
      expect(account).to.be.null;
    });
  });
});
