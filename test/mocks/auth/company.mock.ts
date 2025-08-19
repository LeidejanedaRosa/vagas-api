export const companyMock = () => {
  return {
    id: '729c7919-583c-40a5-b0ca-137e282345d4',
    companyName: 'Test Company Ltd',
    email: 'company@test.com',
    password: '$2b$10$hashedpassword',
    cnpj: '12345678000123',
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
    id: '729c7919-583c-40a5-b0ca-137e282345d4',
    companyName: 'Unconfirmed Company Ltd',
    email: 'unconfirmed@test.com',
    password: '$2b$10$hashedpassword',
    cnpj: '12345678000124',
    mailConfirm: false,
    policies: true,
    created_at: '2023-02-21T00:25:07.000Z',
    updated_at: '2023-02-21T00:25:07.000Z',
  };
};

export const companyEntityMock = () => {
  return {
    id: '729c7919-583c-40a5-b0ca-137e282345d4',
    companyName: 'Test Company Ltd',
    email: 'company@test.com',
    cnpj: '12345678000123',
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
