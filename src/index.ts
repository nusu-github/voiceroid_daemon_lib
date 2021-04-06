import { toHiragana } from '@koozaki/romaji-conv';
import cheerio from 'cheerio';
import got from 'got';
import {
  current_speaker,
  parameter_data,
  speaker_list,
  voiceroid_daemon_config
} from './type';
import FormData = require('form-data');

class voiceroid_daemon {
  url_list: {
    converttext: string;
    current_speaker: string;
    getkey: string;
    setting: string;
    speaker: string;
    speakers: string;
    speechtext: string;
  };

  constructor(address: string, port: number) {
    const base = encodeURI(`${address}:${port}`);
    this.url_list = {
      converttext: encodeURI(`${base}/api/converttext`),
      current_speaker: encodeURI(`${base}/api/get/current_speaker`),
      getkey: encodeURI(`${base}/api/getkey/VoiceroidEditor.exe`),
      setting: encodeURI(`${base}/Home/SystemSetting`),
      speaker: encodeURI(`${base}/api/set/speaker`),
      speakers: encodeURI(`${base}/api/get/speakers`),
      speechtext: encodeURI(`${base}/api/speechtext`),
    };
  }

  /**
   * voiceroid_daemonで利用可能な話者の一覧を返す
   * @returns 話者一覧
   */
  async speakers(): Promise<speaker_list[]> {
    const { url_list } = this;
    const current_speaker: current_speaker = await got(
      url_list.current_speaker,
    ).json();
    const speakers: [string, string] = await got(url_list.speakers).json();
    const list = Object.entries(speakers)
      .map(([voiceDbName, speakerName]) => {
        const search_west = /_west_/;
        const search_emo = /_emo_/;
        return {
          name: `${toHiragana(voiceDbName.replace(/_.*/, ''))}${
            (search_west.exec(voiceDbName) && ' 関西弁') || ''
          }`.trim(),
          roman: `${voiceDbName.replace(/_.*/, '')}${
            (search_west.exec(voiceDbName) && '_west') || ''
          }`,
          voice_library: speakerName[0],
          selected:
            (voiceDbName === current_speaker.voiceDbName && true) || false,
          emotion: (search_emo.exec(voiceDbName) && true) || false,
          west: (search_west.exec(voiceDbName) && true) || false,
        };
      })
      .sort((a, b) => (a.voice_library > b.voice_library && 1) || -1);
    return list;
  }

  /**
   * 話者を変更する
   * @param speaker_data 話者情報
   */
  async set_speaker(speaker_data: current_speaker): Promise<void> {
    const { url_list } = this;
    await got.post(url_list.speaker, {
      method: 'POST',
      json: speaker_data,
    });
  }

  /**
   * 文章をVOICEROIDの読み仮名に変換する
   * @param parameter_data スピーチパラメータ
   * @returns 読み仮名
   */
  async convert_text_kana(parameter_data: parameter_data): Promise<string> {
    const { url_list } = this;
    const { body } = await got.post(url_list.converttext, {
      method: 'POST',
      json: parameter_data,
    });
    return body;
  }

  /**
   * 文章の音声データ(wav)を返す
   * @param parameter_data スピーチパラメータ
   * @returns 音声データのstream
   */
  convert_text_voice(
    parameter_data: parameter_data,
  ): import('got/dist/source/core').default {
    const { url_list } = this;
    return got.stream(url_list.speechtext, {
      method: 'POST',
      json: parameter_data,
    });
  }

  /**
   * 認証コードのシード値を取得します。(ホストのマシンでVOICEROID2を起動した状態で実行してください。)
   * @returns 認証コードのシード値
   */
  async get_authorization_code(): Promise<string> {
    const { url_list } = this;
    const { body } = await got(url_list.getkey);
    if (!body) throw new Error('Failed to get');
    return body;
  }

  /**
   * 設定内容を取得する。
   * @returns 設定内容
   */
  async get_system_setting(): Promise<voiceroid_daemon_config> {
    const { url_list } = this;
    const { body } = await got(url_list.setting);
    const $ = cheerio.load(body);
    const auth_code_seed = $('#AuthCodeSeed').val();
    const cors_addresses = $('#CorsAddresses').val();
    const install_path = $('#InstallPath').val();
    const kana_timeout = $('#KanaTimeout').val();
    const language_name = [
      {
        selected:
          ($('#LanguageName > option:nth-child(1)').attr('selected') && true)
          || false,
        value: 'Default',
      },
      {
        selected:
          ($('#LanguageName > option:nth-child(2)').attr('selected') && true)
          || false,
        value: $('#LanguageName > option:nth-child(2)').val(),
      },
      {
        selected:
          ($('#LanguageName > option:nth-child(3)').attr('selected') && true)
          || false,
        value: $('#LanguageName > option:nth-child(3)').val(),
      },
    ];
    const listening_address = $('#ListeningAddress').val();
    const phrase_dictionary_path = $('#PhraseDictionaryPath').val();
    const setting_file_path = $('#setting_file_path').val();
    const speech_timeout = $('#SpeechTimeout').val();
    const symbol_dictionary_path = $('#SymbolDictionaryPath').val();
    const voiceroid_editor_exe = $('#VoiceroidEditorExe').val();
    const word_dictionary_path = $('#WordDictionaryPath').val();
    return {
      auth_code_seed,
      cors_addresses,
      install_path,
      kana_timeout,
      language_name,
      listening_address,
      phrase_dictionary_path,
      setting_file_path,
      speech_timeout,
      symbol_dictionary_path,
      voiceroid_editor_exe,
      word_dictionary_path,
    };
  }

  /**
   * 設定を変更する。
   * @param config get_system_settingの取得できる内容
   * @returns 変更時のメッセージ 問題なければ「正常に変更されました」
   */
  async set_system_setting(config: voiceroid_daemon_config): Promise<string> {
    const { url_list } = this;
    const current_data = await this.get_system_setting();
    const form = new FormData();
    form.append(
      'auth_code_seed',
      config.auth_code_seed || current_data.auth_code_seed,
    );
    form.append(
      'cors_addresses',
      config.cors_addresses || current_data.cors_addresses,
    );
    form.append(
      'install_path',
      config.install_path || current_data.install_path,
    );
    form.append(
      'kana_timeout',
      config.kana_timeout || current_data.kana_timeout,
    );
    form.append(
      'language_name',
      config.language_name
        || current_data.language_name?.filter(({ selected }) => selected)[0].value,
    );
    form.append(
      'listening_address',
      config.listening_address || current_data.listening_address,
    );
    form.append(
      'phrase_dictionary_path',
      config.phrase_dictionary_path || current_data.phrase_dictionary_path,
    );
    form.append(
      'setting_file_path',
      config.setting_file_path || current_data.setting_file_path,
    );
    form.append(
      'speech_timeout',
      config.speech_timeout || current_data.speech_timeout,
    );
    form.append(
      'symbol_dictionary_path',
      config.symbol_dictionary_path || current_data.symbol_dictionary_path,
    );
    form.append(
      'voiceroid_editor_exe',
      config.voiceroid_editor_exe || current_data.voiceroid_editor_exe,
    );
    form.append(
      'word_dictionary_path',
      config.word_dictionary_path || current_data.word_dictionary_path,
    );
    const { body } = await got.post(url_list.setting, { body: form });
    const $ = cheerio.load(body);
    const return_result = $('head > script')
      .html()
      ?.split(/\n/)
      .filter((value: string) => /var result =/.test(value))[0]
      .replace(/.+=\s'/, '')
      .replace(/'.+/, '');
    if (!return_result) throw new Error('Not data');
    if (/エラー/.test(return_result)) throw new Error(return_result);
    return return_result;
  }
}

export = voiceroid_daemon;
