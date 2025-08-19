import {
  TEST_IDS,
  TEST_EMAILS,
  TEST_COMPANY_DATA,
  TEST_PASSWORDS,
} from '../../config/test-constants';

export const companyMock = () => {
  return {
    id: TEST_IDS.COMPANY_ID,
    companyName: TEST_COMPANY_DATA.NAME,
    email: TEST_EMAILS.COMPANY,
    password: TEST_PASSWORDS.HASHED_BCRYPT,
    cnpj: TEST_COMPANY_DATA.CNPJ,
    about: 'A test company for unit tests',
    phone: '11987654321',
    address: 'Test Street, 123',
    city: 'Test City',
    state: 'Test State',
    cep: '12345-678',
    website: 'https://testcompany.com',
    mailConfirm: true,
    policies: true,
    created_at: '2023-02-21T00:25:07.000Z',
    updated_at: '2023-02-21T00:25:07.000Z',
  };
};

export const companyWithUnconfirmedEmailMock = () => {
  return {
    id: TEST_IDS.COMPANY_ID,
    companyName: 'Unconfirmed Company Ltd',
    email: TEST_EMAILS.UNCONFIRMED_COMPANY,
    password: TEST_PASSWORDS.HASHED_BCRYPT,
    cnpj: TEST_COMPANY_DATA.UNCONFIRMED_CNPJ,
    mailConfirm: false,
    policies: true,
    created_at: '2023-02-21T00:25:07.000Z',
    updated_at: '2023-02-21T00:25:07.000Z',
  };
};

export const companyEntityMock = () => {
  return {
    id: TEST_IDS.COMPANY_ID,
    companyName: TEST_COMPANY_DATA.NAME,
    email: TEST_EMAILS.COMPANY,
    cnpj: TEST_COMPANY_DATA.CNPJ,
    about: 'A test company for unit tests',
    phone: '11987654321',
    address: 'Test Street, 123',
    city: 'Test City',
    state: 'Test State',
    cep: '12345-678',
    website: 'https://testcompany.com',
    mailConfirm: true,
    policies: true,
    created_at: '2023-02-21T00:25:07.000Z',
    updated_at: '2023-02-21T00:25:07.000Z',
  };
};
