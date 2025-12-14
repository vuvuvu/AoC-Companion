export enum Sender {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system'
}

export enum HintLevel {
  VAGUE = 'Vague Hint',
  LOGIC = 'Logic/Algorithm',
  PSEUDOCODE = 'Pseudocode',
  DEBUG = 'Debugging Help'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
}

export interface AppState {
  language: string;
  year: string;
  day: string;
  hintLevel: HintLevel;
  puzzleContext: string;
}

export const LANGUAGES = [
  'Python', 'JavaScript', 'TypeScript', 'Rust', 'Go', 'Zig', 'C++', 'Java', 'C#', 'Ruby', 'Haskell'
];

export const YEARS = [
  '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015'
];

export const DAYS = Array.from({ length: 25 }, (_, i) => (i + 1).toString());