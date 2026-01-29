export interface ChargingStation {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  address: string;
  created_at: string;
}
