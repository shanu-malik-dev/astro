import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { MOBILE_VALIDATION_RULES } from '../constants/auth.constant';

type MobileValidationDto = {
  country_code?: string;
  mobile?: string;
};

@ValidatorConstraint({ name: 'isSupportedMobile', async: false })
export class IsSupportedMobileConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
      return false;
    }

    const dto = args.object as MobileValidationDto;
    const rule =
      MOBILE_VALIDATION_RULES[
        dto.country_code as keyof typeof MOBILE_VALIDATION_RULES
      ];

    return Boolean(rule?.pattern.test(value));
  }

  defaultMessage(args: ValidationArguments) {
    const dto = args.object as MobileValidationDto;
    const rule =
      MOBILE_VALIDATION_RULES[
        dto.country_code as keyof typeof MOBILE_VALIDATION_RULES
      ];

    return rule?.message || 'Country code is not supported.';
  }
}

export function IsSupportedMobile(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSupportedMobileConstraint,
    });
  };
}
