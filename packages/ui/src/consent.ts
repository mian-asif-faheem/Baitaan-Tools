/** Text for the cookie banner, one object per language. */
export interface ConsentStrings {
  title: string;
  text: string;
  privacyLabel: string;
  privacyHref: string;
  accept: string;
  reject: string;
  customize: string;
  save: string;
  necessary: string;
  necessaryDesc: string;
  analytics: string;
  analyticsDesc: string;
  ads: string;
  adsDesc: string;
  alwaysOn: string;
}

/** Cookie value: "v1|analytics:0|ads:1|<unix seconds>". Six months, as EU regulators recommend. */
export const CONSENT_DAYS = 182;
