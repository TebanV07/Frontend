export interface UserMinimal {
  id: number;
  username: string;
  name?: string;
  avatar?: string;
  preferred_translation_language?: string;
  country_code?: string;
  native_language?: string;

  // permit extra properties coming from backend without breaking template checks
  [key: string]: any;
}
