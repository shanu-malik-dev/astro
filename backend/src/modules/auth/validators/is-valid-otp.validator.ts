import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidOtp', async: false })
export class IsValidOtpConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    const otpLength = Number(process.env.OTP_LENGTH || 6);
    return typeof value === 'string' && new RegExp(`^\\d{${otpLength}}$`).test(value);
  }

  defaultMessage() {
    const otpLength = Number(process.env.OTP_LENGTH || 6);
    return `OTP must be a ${otpLength}-digit numeric value.`;
  }
}

export function IsValidOtp(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidOtpConstraint,
    });
  };
}
