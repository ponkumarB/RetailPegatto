declare module 'country-state-city' {
  export const Country: {
    getAllCountries: () => any[];
    getCountryByCode: (isoCode: string) => any;
  };
  export const State: {
    getAllStates: () => any[];
    getStatesOfCountry: (countryCode: string) => any[];
    getStateByCodeAndCountry: (stateCode: string, countryCode: string) => any;
  };
  export const City: {
    getAllCities: () => any[];
    getCitiesOfState: (countryCode: string, stateCode: string) => any[];
    getCitiesOfCountry: (countryCode: string) => any[];
  };
}
