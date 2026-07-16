"use client";

import { useEffect, useState } from "react";
import { apiService } from "./api-service";

export interface CountryCodeOption {
  value: string;
  label: string;
  country_name?: string;
  country_code?: string;
  mobile_prefix?: string;
  logo?: string | null;
}

interface CountryCodeResponse {
  success: boolean;
  message: string;
  data?: CountryCodeOption[];
}

let countryCodeCache: CountryCodeOption[] | null = null;
let countryCodeRequest: Promise<CountryCodeOption[]> | null = null;

export async function fetchCountryCodes() {
  if (countryCodeCache) return countryCodeCache;

  if (!countryCodeRequest) {
    countryCodeRequest = apiService<CountryCodeResponse>(
      "/shared/get-country-num",
      { method: "GET" }
    )
      .then((response) => {
        countryCodeCache = response.data || [];
        return countryCodeCache;
      })
      .finally(() => {
        countryCodeRequest = null;
      });
  }

  return countryCodeRequest;
}

export function useCountryCodes() {
  const [countryCodes, setCountryCodes] = useState<CountryCodeOption[]>(
    countryCodeCache || []
  );
  const [loading, setLoading] = useState(!countryCodeCache);

  useEffect(() => {
    let mounted = true;

    fetchCountryCodes()
      .then((options) => {
        if (mounted) setCountryCodes(options);
      })
      .catch(() => {
        if (mounted) setCountryCodes([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { countryCodes, loading };
}
