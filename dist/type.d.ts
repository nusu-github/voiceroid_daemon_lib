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
    language_name?: {
        selected: boolean;
        value: string;
    }[];
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
