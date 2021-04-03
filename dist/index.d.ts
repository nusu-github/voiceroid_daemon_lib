import { current_speaker, parameter_data, speaker_list, voiceroid_daemon_config } from "./type";
declare class voiceroid_daemon {
    url_list: {
        converttext: string;
        current_speaker: string;
        getkey: string;
        setting: string;
        speaker: string;
        speakers: string;
        speechtext: string;
    };
    constructor(address: string, port: number);
    /**
     * voiceroid_daemonで利用可能な話者の一覧を返す
     * @returns 話者一覧
     */
    speakers(): Promise<speaker_list[]>;
    /**
     * 話者を変更する
     * @param speaker_data 話者情報
     */
    set_speaker(speaker_data: current_speaker): Promise<void>;
    /**
     * 文章をVOICEROIDの読み仮名に変換する
     * @param parameter_data スピーチパラメータ
     * @returns 読み仮名
     */
    convert_text_kana(parameter_data: parameter_data): Promise<string>;
    /**
     * 文章の音声データ(wav)を返す
     * @param parameter_data スピーチパラメータ
     * @returns 音声データのstream
     */
    convert_text_voice(parameter_data: parameter_data): import("got/dist/source/core").default;
    /**
     * 認証コードのシード値を取得します。(ホストのマシンでVOICEROID2を起動した状態で実行してください。)
     * @returns 認証コードのシード値
     */
    get_authorization_code(): Promise<string>;
    /**
     * 設定内容を取得する。
     * @returns 設定内容
     */
    get_system_setting(): Promise<voiceroid_daemon_config>;
    /**
     * 設定を変更する。
     * @param config get_system_settingの取得できる内容
     * @returns 変更時のメッセージ 問題なければ「正常に変更されました」
     */
    set_system_setting(config: voiceroid_daemon_config): Promise<string>;
}
export = voiceroid_daemon;
