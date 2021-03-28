import got from "got";
import { toHiragana } from "@koozaki/romaji-conv";
import * as validator from "validatorjs";
import * as FormData from "form-data";
import * as cheerio from "cheerio";
validator.useLang("ja.js");

/*
 バリデーション一覧
*/
const speaker_information_rules = {
  voiceDbName: "required|string",
  speakerName: "required|string",
};
const speech_parameter_rules = {
  Text: "required|string",
  Kana: "string",
  Speaker: {
    Volume: "numeric",
    Speed: "numeric",
    Pitch: "numeric",
    Emphasis: "numeric",
    PauseMiddle: "numeric",
    PauseLong: "numeric",
    PauseSentence: "numeric",
  },
  SpeakerSetting: {
    VoiceDbName: "string",
    SpeakerName: "string",
  },
};

/**
 * Home/SpeakerSetting
 * voiceroid_daemonで利用可能な話者の一覧を返す
 * @param {string} address voiceroid_daemonのアドレス
 * @param {number} port voiceroid_daemonのポート
 */
const returns_list_available_speaker = async (
  address: string,
  port: number
) => {
  const current_speaker = await got(
    `${address}:${port}/api/get/current_speaker`
  );
  const speakers = await got(`${address}:${port}/api/get/speakers`);
  if (!speakers.body) throw new Error("No body data");
  const speakers_list_json: Record<string, string> = JSON.parse(speakers.body);
  const current_speaker_json = JSON.parse(current_speaker.body);
  const list = Object.entries(speakers_list_json)
    .map(([voiceDbName, speakerName]) => {
      return {
        name: `${toHiragana(voiceDbName.replace(/_.*/, ""))}${
          (voiceDbName.match("_west_") && " 関西弁") || ""
        }`.trim(),
        roman: `${voiceDbName.replace(/_.*/, "")}${
          (voiceDbName.match("_west_") && "_west") || ""
        }`,
        voice_library: speakerName[0],
        selected:
          (voiceDbName === current_speaker_json.voiceDbName && true) || false,
        emotion: (voiceDbName.match("_emo_") && true) || false,
        west: (voiceDbName.match("_west_") && true) || false,
      };
    })
    .sort((a, b) => (a.voice_library > b.voice_library && 1) || -1);
  return list;
};
/**
 * Home/SpeakerSetting
 * 話者を変更する
 * @param {string} address voiceroid_daemonのアドレス
 * @param {number} port voiceroid_daemonのポート
 * @param {Record<string, any>} voice_data 話者情報
 */
const change_speaker = async (
  address: string,
  port: number,
  voice_data: Record<string, any>
) => {
  const validation = new validator(voice_data, speaker_information_rules);
  if (validation.fails())
    throw new Error(`validator Error ${validation.errors.all()}`);
  return await got.post(`${address}:${port}/api/set/speaker`, {
    method: "POST",
    json: voice_data,
  });
};

/**
 * /api/converttext
 * 文章をVOICEROIDの読み仮名に変換する
 * @param {string} address voiceroid_daemonのアドレス
 * @param {number} port voiceroid_daemonのポート
 * @param {Record<string, any>} parameter_data スピーチパラメータ
 */
const convert_sentence_into_kana = async (
  address: string,
  port: number,
  parameter_data: Record<string, any>
) => {
  const validation = new validator(parameter_data, speech_parameter_rules);
  if (validation.fails())
    throw new Error(`validator Error ${validation.errors.all()}`);
  return await got.post(`${address}:${port}/api/converttext`, {
    method: "POST",
    json: parameter_data,
  });
};

/**
 * /api/speechtext
 * 文章の音声データ(wav)を返す
 * @param {string} address voiceroid_daemonのアドレス
 * @param {number} port voiceroid_daemonのポート
 * @param {Record<string, any>} parameter_data スピーチパラメータ
 */
const convert_sentence_into_voice = (
  address: string,
  port: number,
  parameter_data: Record<string, any>
) => {
  const validation = new validator(parameter_data, speech_parameter_rules);
  if (validation.fails())
    throw new Error(`validator Error ${validation.errors.all()}`);
  parameter_data.Text = `${parameter_data.Text}。。`;
  return got.stream(`${address}:${port}/api/speechtext`, {
    method: "POST",
    json: parameter_data,
  });
};

/**
 * 認証コードのシード値を取得します。(ホストのマシンでVOICEROID2を起動した状態で実行してください。)
 * @param {string} address
 * @param {number} port
 */
const get_authorization_code_seed_value = async (
  address: string,
  port: number
) => {
  const url = `${address}:${port}/api/getkey/VoiceroidEditor.exe`;
  const { body } = await got(url);
  if (body) return body;
  else throw new Error("Failed to get");
};

/**
 * 設定内容を取得する。
 * @param {string} address
 * @param {number} port
 */
const get_system_setting = async (address: string, port: number) => {
  const url = `${address}:${port}/Home/SystemSetting`;
  const { body } = await got(url);
  const $ = cheerio.load(body);
  const install_path = $("#InstallPath").val();
  const voiceroid_editor_exe = $("#VoiceroidEditorExe").val();
  const auth_code_seed = $("#AuthCodeSeed").val();
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
  const phrase_dictionary_path = $("#PhraseDictionaryPath").val();
  const word_dictionary_path = $("#WordDictionaryPath").val();
  const symbol_dictionary_path = $("#SymbolDictionaryPath").val();
  const kana_timeout = $("#KanaTimeout").val();
  const speech_timeout = $("#SpeechTimeout").val();
  const listening_address = $("#ListeningAddress").val();
  return {
    install_path,
    voiceroid_editor_exe,
    auth_code_seed,
    language_name,
    phrase_dictionary_path,
    word_dictionary_path,
    symbol_dictionary_path,
    kana_timeout,
    speech_timeout,
    listening_address,
  };
};

/**
 * 設定を変更する。
 * config_jsonはその内容、複数同時や単体変更も可能
 * ただし一部の設定はvoiceroid_daemon本体の再起動を必要とするので注意
 * {location: "" , content: "" }
 * @param {string} address
 * @param {number} port
 * @param {Record<string, any>} config_json
 */
const set_system_setting = async (
  address: string,
  port: number,
  config_json: Record<string, any>
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
      current_data.language_name.filter(({ selected }) => selected)[0].value
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
    .html()!
    .split(/\n/)
    .filter((value: string) => /var result =/.test(value))[0]
    .replace(/.+=\s'/, "")
    .replace(/'.+/, "");
  if (/エラー/.test(return_result)) throw new Error(return_result);
  else return return_result;
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
