declare const _default: {
    returns_list_available_speaker: (address: string, port: number) => Promise<{
        name: string;
        roman: string;
        voice_library: string;
        selected: boolean;
        emotion: boolean;
        west: boolean;
    }[]>;
    change_speaker: (address: string, port: number, voice_data: {
        voiceDbName: string;
        speakerName: string;
    }) => Promise<import("got/dist/source").Response<string>>;
    convert_sentence_into_voice: (address: string, port: number, parameter_data: {
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
    }) => import("got/dist/source/core").default;
    convert_sentence_into_kana: (address: string, port: number, parameter_data: {
        Text: string;
    }) => Promise<import("got/dist/source").Response<string>>;
    get_authorization_code_seed_value: (address: string, port: number) => Promise<string>;
    get_system_setting: (address: string, port: number) => Promise<{
        install_path: string;
        voiceroid_editor_exe: string;
        auth_code_seed: string;
        language_name: {
            selected: boolean;
            value: string;
        }[];
        phrase_dictionary_path: string;
        word_dictionary_path: string;
        symbol_dictionary_path: string;
        kana_timeout: string;
        speech_timeout: string;
        listening_address: string;
    }>;
    set_system_setting: (address: string, port: number, config_json: {
        install_path: string;
        voiceroid_editor_exe: string;
        auth_code_seed: string;
        language_name: {
            selected: boolean;
            value: string;
        }[];
        phrase_dictionary_path: string;
        word_dictionary_path: string;
        symbol_dictionary_path: string;
        kana_timeout: string;
        speech_timeout: string;
        listening_address: string;
    }) => Promise<string>;
};
export = _default;
