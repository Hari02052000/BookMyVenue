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
