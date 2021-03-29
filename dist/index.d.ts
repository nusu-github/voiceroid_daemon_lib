interface parameter_data {
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
interface voiceroid_daemon_config {
    install_path?: string;
    voiceroid_editor_exe?: string;
    auth_code_seed?: string;
    language_name?: {
        selected: boolean;
        value: string;
    }[];
    phrase_dictionary_path?: string;
    word_dictionary_path?: string;
    symbol_dictionary_path?: string;
    kana_timeout?: string;
    speech_timeout?: string;
    listening_address?: string;
}
interface returns_list_available_speaker {
    (address: string, port: number): Promise<{
        name: string;
        roman: string;
        voice_library: string;
        selected: boolean;
        emotion: boolean;
        west: boolean;
    }[]>;
}
interface change_speaker {
    (address: string, port: number, voice_data: {
        voiceDbName: string;
        speakerName: string;
    }): Promise<import("got/dist/source").Response<string>>;
}
interface convert_sentence_into_kana {
    (address: string, port: number, parameter_data: parameter_data): Promise<import("got/dist/source").Response<string>>;
}
interface convert_sentence_into_voice {
    (address: string, port: number, parameter_data: parameter_data): import("got/dist/source/core").default;
}
interface get_authorization_code_seed_value {
    (address: string, port: number): Promise<string>;
}
interface get_system_setting {
    (address: string, port: number): Promise<voiceroid_daemon_config>;
}
interface set_system_setting {
    (address: string, port: number, config_json: voiceroid_daemon_config): Promise<string>;
}
/**
 * Home/SpeakerSetting
 * voiceroid_daemonで利用可能な話者の一覧を返す
 * @param address voiceroid_daemonのアドレス
 * @param port voiceroid_daemonのポート
 * @returns 話者一覧
 */
declare const returns_list_available_speaker: returns_list_available_speaker;
/**
 * Home/SpeakerSetting
 * 話者を変更する
 * @param address voiceroid_daemonのアドレス
 * @param port voiceroid_daemonのポート
 * @param voice_data 話者情報
 * @returns Response
 */
declare const change_speaker: change_speaker;
/**
 * /api/converttext
 * 文章をVOICEROIDの読み仮名に変換する
 * @param address voiceroid_daemonのアドレス
 * @param port voiceroid_daemonのポート
 * @param parameter_data スピーチパラメータ
 * @returns Response
 */
declare const convert_sentence_into_kana: convert_sentence_into_kana;
/**
 * /api/speechtext
 * 文章の音声データ(wav)を返す
 * @param address voiceroid_daemonのアドレス
 * @param port voiceroid_daemonのポート
 * @param parameter_data スピーチパラメータ
 * @returns Response
 */
declare const convert_sentence_into_voice: convert_sentence_into_voice;
/**
 * 認証コードのシード値を取得します。(ホストのマシンでVOICEROID2を起動した状態で実行してください。)
 * @param address voiceroid_daemonのアドレス
 * @param port voiceroid_daemonのポート
 * @returns body
 */
declare const get_authorization_code_seed_value: get_authorization_code_seed_value;
/**
 * 設定内容を取得する。
 * @param address voiceroid_daemonのアドレス
 * @param port voiceroid_daemonのポート
 * @returns
 */
declare const get_system_setting: get_system_setting;
/**
 * 設定を変更する。
 * config_jsonはその内容、複数同時や単体変更も可能
 * ただし一部の設定はvoiceroid_daemon本体の再起動を必要とするので注意
 * 再起動の命令はこちらからは出せないため物理アクセス必須です
 * @param address voiceroid_daemonのアドレス
 * @param port voiceroid_daemonのポート
 * @param config_json get_system_settingの取得できる内容
 * @returns
 */
declare const set_system_setting: set_system_setting;
declare const _default: {
    returns_list_available_speaker: returns_list_available_speaker;
    change_speaker: change_speaker;
    convert_sentence_into_voice: convert_sentence_into_voice;
    convert_sentence_into_kana: convert_sentence_into_kana;
    get_authorization_code_seed_value: get_authorization_code_seed_value;
    get_system_setting: get_system_setting;
    set_system_setting: set_system_setting;
};
export = _default;
