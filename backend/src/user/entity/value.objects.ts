// src/domain/value-objects/Money.ts
export class Money {
  private readonly amount: number;
  private readonly currency: string;

  constructor(amount: number, currency: string = 'INR') {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    this.amount = amount;
    this.currency = currency;
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract different currencies');
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  multiplyBy(multiplier: number): Money {
    return new Money(this.amount * multiplier, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount &&
      this.currency === other.currency;
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}

// src/domain/value-objects/Coordinates.ts
export class Coordinates {
  private readonly longitude: number;
  private readonly latitude: number;

  constructor(longitude: number, latitude: number) {
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    this.longitude = longitude;
    this.latitude = latitude;
  }

  getLongitude(): number {
    return this.longitude;
  }

  getLatitude(): number {
    return this.latitude;
  }

  // Returns in GeoJSON format for MongoDB
  toGeoJSON(): { type: string; coordinates: [number, number] } {
    return {
      type: 'Point',
      coordinates: [this.longitude, this.latitude],
    };
  }

  equals(other: Coordinates): boolean {
    return this.longitude === other.longitude &&
      this.latitude === other.latitude;
  }

  distanceTo(other: Coordinates): number {
    // Haversine formula for distance between two points
    const R = 6371; // Earth radius in km
    const lat1 = (this.latitude * Math.PI) / 180;
    const lat2 = (other.latitude * Math.PI) / 180;
    const dlat = ((other.latitude - this.latitude) * Math.PI) / 180;
    const dlng = ((other.longitude - this.longitude) * Math.PI) / 180;

    const a =
      Math.sin(dlat / 2) * Math.sin(dlat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(dlng / 2) *
        Math.sin(dlng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// src/domain/value-objects/Email.ts
export class Email {
  private readonly value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Invalid email: ${value}`);
    }
    this.value = value.toLowerCase();
  }

  getValue(): string {
    return this.value;
  }

  private isValid(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

// src/domain/value-objects/PricingBreakdown.ts
export class PricingBreakdown {
  private readonly basePrice: Money;
  private readonly gst: Money;
  private readonly platformFee: Money;
  private readonly total: Money;

  constructor(
    basePrice: Money,
    gst: Money,
    platformFee: Money,
  ) {
    this.basePrice = basePrice;
    this.gst = gst;
    this.platformFee = platformFee;
    this.total = basePrice.add(gst).add(platformFee);
  }

  getBasePrice(): Money {
    return this.basePrice;
  }

  getGST(): Money {
    return this.gst;
  }

  getPlatformFee(): Money {
    return this.platformFee;
  }

  getTotal(): Money {
    return this.total;
  }

  static calculate(
    basePrice: number,
    gstPercentage: number = 0,
    platformFeePercentage: number = 5,
  ): PricingBreakdown {
    const baseMoney = new Money(basePrice);
    const gstMoney = baseMoney.multiplyBy(gstPercentage / 100);
    const feeMoney = baseMoney.multiplyBy(platformFeePercentage / 100);
    return new PricingBreakdown(baseMoney, gstMoney, feeMoney);
  }
}