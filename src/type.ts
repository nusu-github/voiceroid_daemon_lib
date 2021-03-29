export interface parameter_data {
  Text: string;
  Kana: string;
  Speaker: {
    Volume: number;
    Speed: number;
    Pitch: number;
    Emphasis: number;
    PauseMiddle: number;
    PauseLong: number;
    PauseSentence: number;
  };
  SpeakerSetting: {
    VoiceDbName: string;
    SpeakerName: string;
  };
}

export interface current_speaker {
  voiceDbName: string;
  speakerName: string;
}

export interface voiceroid_daemon_config {
  auth_code_seed?: string;
  cors_addresses?: string;
  install_path?: string;
  kana_timeout?: string;
  language_name?: { selected: boolean; value: string }[];
  listening_address?: string;
  phrase_dictionary_path?: string;
  setting_file_path?: string;
  speech_timeout?: string;
  symbol_dictionary_path?: string;
  voiceroid_editor_exe?: string;
  word_dictionary_path?: string;
}

export interface speaker_list {
  name: string;
  roman: string;
  voice_library: string;
  selected: boolean;
  emotion: boolean;
  west: boolean;
}

export interface returns_list_available_speaker {
  (address: string, port: number): Promise<speaker_list[]>;
}

export interface change_speaker {
  (address: string, port: number, voice_data: current_speaker): Promise<
    import("got/dist/source").Response<string>
  >;
}

export interface convert_sentence_into_kana {
  (address: string, port: number, parameter_data: parameter_data): Promise<
    import("got/dist/source").Response<string>
  >;
}

export interface convert_sentence_into_voice {
  (
    address: string,
    port: number,
    parameter_data: parameter_data
  ): import("got/dist/source/core").default;
}

export interface get_authorization_code_seed_value {
  (address: string, port: number): Promise<string>;
}

export interface get_system_setting {
  (address: string, port: number): Promise<voiceroid_daemon_config>;
}

export interface set_system_setting {
  (
    address: string,
    port: number,
    config_json: voiceroid_daemon_config
  ): Promise<string>;
}
