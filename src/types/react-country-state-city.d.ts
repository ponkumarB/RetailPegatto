declare module 'react-country-state-city' {
  export function GetCountries(): Promise<any[]>;
  export function GetState(countryId: number): Promise<any[]>;
  export function GetCity(countryId: number, stateId: number): Promise<any[]>;
  export const CountrySelect: any;
  export const StateSelect: any;
  export const CitySelect: any;
}
