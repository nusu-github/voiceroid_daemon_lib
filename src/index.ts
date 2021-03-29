import got from "got";
import { toHiragana } from "@koozaki/romaji-conv";
import FormData = require("form-data");
import * as cheerio from "cheerio";
import {
  change_speaker,
  convert_sentence_into_kana,
  convert_sentence_into_voice,
  current_speaker,
  get_authorization_code_seed_value,
  get_system_setting,
  returns_list_available_speaker,
  set_system_setting,
} from "./type";

/**
 * Home/SpeakerSetting
 * voiceroid_daemonで利用可能な話者の一覧を返す
 * @param address voiceroid_daemonのアドレス
 * @param port voiceroid_daemonのポート
 * @returns 話者一覧
 */
const returns_list_available_speaker: returns_list_available_speaker = async (
  address,
  port
) => {
  const current_speaker: current_speaker = await got(
    `${address}:${port}/api/get/current_speaker`
  ).json();
  const speakers: [string, string] = await got(
    `${address}:${port}/api/get/speakers`
  ).json();
  const list = Object.entries(speakers)
    .map(([voiceDbName, speakerName]) => {
      const search_west = /_west_/;
      const search_emo = /_emo_/;
      return {
        name: `${toHiragana(voiceDbName.replace(/_.*/, ""))}${
          (search_west.exec(voiceDbName) && " 関西弁") || ""
        }`.trim(),
        roman: `${voiceDbName.replace(/_.*/, "")}${
          (search_west.exec(voiceDbName) && "_west") || ""
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
};

/**
 * Home/SpeakerSetting
 * 話者を変更する
 * @param address voiceroid_daemonのアドレス
 * @param port voiceroid_daemonのポート
 * @param voice_data 話者情報
 * @returns Response
 */
const change_speaker: change_speaker = async (address, port, voice_data) =>
  await got.post(`${address}:${port}/api/set/speaker`, {
    method: "POST",
    json: voice_data,
  });

/**
 * /api/converttext
 * 文章をVOICEROIDの読み仮名に変換する
 * @param address voiceroid_daemonのアドレス
 * @param port voiceroid_daemonのポート
 * @param parameter_data スピーチパラメータ
 * @returns Response
 */
const convert_sentence_into_kana: convert_sentence_into_kana = async (
  address,
  port,
  parameter_data
) =>
  await got.post(`${address}:${port}/api/converttext`, {
    method: "POST",
    json: parameter_data,
  });

/**
 * /api/speechtext
 * 文章の音声データ(wav)を返す
 * @param address voiceroid_daemonのアドレス
 * @param port voiceroid_daemonのポート
 * @param parameter_data スピーチパラメータ
 * @returns Response
 */
const convert_sentence_into_voice: convert_sentence_into_voice = (
  address,
  port,
  parameter_data
) =>
  got.stream(`${address}:${port}/api/speechtext`, {
    method: "POST",
    json: parameter_data,
  });

/**
 * 認証コードのシード値を取得します。(ホストのマシンでVOICEROID2を起動した状態で実行してください。)
 * @param address voiceroid_daemonのアドレス
 * @param port voiceroid_daemonのポート
 * @returns body
 */
const get_authorization_code_seed_value: get_authorization_code_seed_value = async (
  address,
  port
) => {
  const url = `${address}:${port}/api/getkey/VoiceroidEditor.exe`;
  const { body } = await got(url);
  if (!body) throw new Error("Failed to get");
  return body;
};

/**
 * 設定内容を取得する。
 * @param address voiceroid_daemonのアドレス
 * @param port voiceroid_daemonのポート
 * @returns
 */
const get_system_setting: get_system_setting = async (address, port) => {
  const url = `${address}:${port}/Home/SystemSetting`;
  const { body } = await got(url);
  const $ = cheerio.load(body);
  const auth_code_seed = $("#AuthCodeSeed").val();
  const cors_addresses = $("#CorsAddresses").val();
  const install_path = $("#InstallPath").val();
  const kana_timeout = $("#KanaTimeout").val();
  const language_name = [
    {
      selected:
        ($("#LanguageName > option:nth-child(1)").attr("selected") && true) ||
        false,
      value: "Default",
    },
    {
      selected:
        ($("#LanguageName > option:nth-child(2)").attr("selected") && true) ||
        false,
      value: $("#LanguageName > option:nth-child(2)").val(),
    },
    {
      selected:
        ($("#LanguageName > option:nth-child(3)").attr("selected") && true) ||
        false,
      value: $("#LanguageName > option:nth-child(3)").val(),
    },
  ];
  const listening_address = $("#ListeningAddress").val();
  const phrase_dictionary_path = $("#PhraseDictionaryPath").val();
  const setting_file_path = $("#setting_file_path").val();
  const speech_timeout = $("#SpeechTimeout").val();
  const symbol_dictionary_path = $("#SymbolDictionaryPath").val();
  const voiceroid_editor_exe = $("#VoiceroidEditorExe").val();
  const word_dictionary_path = $("#WordDictionaryPath").val();
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
};

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
const set_system_setting: set_system_setting = async (
  address,
  port,
  config_json
) => {
  const url = `${address}:${port}/Home/SystemSetting`;
  const current_data = await get_system_setting(address, port);
  const form = new FormData();
  form.append(
    "InstallPath",
    config_json.install_path || current_data.install_path
  );
  form.append(
    "VoiceroidEditorExe",
    config_json.voiceroid_editor_exe || current_data.voiceroid_editor_exe
  );
  form.append(
    "AuthCodeSeed",
    config_json.auth_code_seed || current_data.auth_code_seed
  );
  form.append(
    "LanguageName",
    config_json.language_name ||
      current_data.language_name?.filter(({ selected }) => selected)[0].value
  );
  form.append(
    "PhraseDictionaryPath",
    config_json.phrase_dictionary_path || current_data.phrase_dictionary_path
  );
  form.append(
    "WordDictionaryPath",
    config_json.word_dictionary_path || current_data.word_dictionary_path
  );
  form.append(
    "SymbolDictionaryPath",
    config_json.symbol_dictionary_path || current_data.symbol_dictionary_path
  );
  form.append(
    "KanaTimeout",
    config_json.kana_timeout || current_data.kana_timeout
  );
  form.append(
    "SpeechTimeout",
    config_json.speech_timeout || current_data.speech_timeout
  );
  form.append(
    "ListeningAddress",
    config_json.listening_address || current_data.listening_address
  );
  const { body } = await got.post(url, { body: form });
  const $ = cheerio.load(body);
  const return_result = $("head > script")
    .html()
    ?.split(/\n/)
    .filter((value: string) => /var result =/.test(value))[0]
    .replace(/.+=\s'/, "")
    .replace(/'.+/, "");
  if (!return_result) throw new Error("Not data");
  if (/エラー/.test(return_result)) throw new Error(return_result);
  return return_result;
};

export = {
  returns_list_available_speaker,
  change_speaker,
  convert_sentence_into_voice,
  convert_sentence_into_kana,
  get_authorization_code_seed_value,
  get_system_setting,
  set_system_setting,
};
