export class PhoneNumber {
  private readonly value: string;

  constructor(value: string) {
    const normalized = PhoneNumber.normalize(value);

    if (!PhoneNumber.isValid(normalized)) {
      throw new Error("Invalid phone number");
    }

    this.value = normalized;
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }

  private static normalize(phone: string): string {
    return phone.replace(/\s+/g, "").trim();
  }

  private static isValid(phone: string): boolean {
    // Example:
    // +919876543210
    // 9876543210

    const regex = /^(\+91)?[6-9]\d{9}$/;

    return regex.test(phone);
  }
}