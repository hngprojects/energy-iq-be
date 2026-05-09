import * as crypto from 'crypto';

export const generateOtp = (): string => {
  const codeLength = 6;
  const buffer = crypto.randomBytes(codeLength);
  let code = '';

  for (let i = 0; i < codeLength; i++) {
    code += buffer[i] % 10;
  }

  return code;
};
