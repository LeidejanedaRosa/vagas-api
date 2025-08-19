export const jwtPayloadMock = () => {
  return {
    email: 'user@test.com',
    iat: 1640995200,
    exp: 1641081600,
  };
};

export const companyJwtPayloadMock = () => {
  return {
    email: 'company@test.com',
    iat: 1640995200,
    exp: 1641081600,
  };
};

export const invalidJwtPayloadMock = () => {
  return {
    email: 'nonexistent@test.com',
    iat: 1640995200,
    exp: 1641081600,
  };
};
