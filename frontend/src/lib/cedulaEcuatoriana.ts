const CEDULA_LENGTH = 10;
const NATURAL_PERSON_MAX_THIRD_DIGIT = 5;
const MIN_PROVINCE_CODE = 1;
const MAX_PROVINCE_CODE = 24;
const COEFFICIENTS = [2, 1, 2, 1, 2, 1, 2, 1, 2];

export function isValidEcuadorianCedula(value: string) {
  const cedula = value.trim();

  if (!/^\d{10}$/.test(cedula)) return false;
  if (/^(\d)\1{9}$/.test(cedula)) return false;

  const provinceCode = Number(cedula.slice(0, 2));
  if (provinceCode < MIN_PROVINCE_CODE || provinceCode > MAX_PROVINCE_CODE) return false;

  const thirdDigit = Number(cedula[2]);
  if (thirdDigit > NATURAL_PERSON_MAX_THIRD_DIGIT) return false;

  const sum = COEFFICIENTS.reduce((total, coefficient, index) => {
    const product = Number(cedula[index]) * coefficient;
    return total + (product > 9 ? product - 9 : product);
  }, 0);

  const verifier = (10 - (sum % 10)) % 10;
  return verifier === Number(cedula[9]);
}
