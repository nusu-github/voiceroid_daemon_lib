const got = require("got");
const FormData = require("form-data");
const cheerio = require("cheerio");

/**
 * Home/SpeakerSetting
 * voiceroid_daemonで利用可能な話者の一覧を返す
 * @param {string} address voiceroid_daemonのアドレス
 * @param {number} port voiceroid_daemonのポート
 */
const returns_list_available_speaker = async (address, port) => {
  const list = [];
  const current_speaker = await got(
    `${address}:${port}/api/get/current_speaker`
  );
  const speakers = await got(`${address}:${port}/api/get/speakers`);
  if (speakers.body) {
    const speakers_list_json = JSON.parse(speakers.body);
    const current_speaker_json = JSON.parse(current_speaker.body);
    console.log(speakers.body)
    for (const [voiceDbName, speakerName] of Object.entries(
      speakers_list_json
    )) {
      list.push({
        name: `${romanto(voiceDbName.replace(/_.*/, ""))}${(voiceDbName.match("_west_") && " 関西弁") || ""
          }`.trim(),
        roman: `${voiceDbName.replace(/_.*/, "")}${(voiceDbName.match("_west_") && "_west") || ""
          }`,
        voice_library: speakerName[0],
        selected:
          (voiceDbName === current_speaker_json.voiceDbName && true) || false,
        emotion: (voiceDbName.match("_emo_") && true) || false,
        west: (voiceDbName.match("_west_") && true) || false,
      });
    }
    return list.sort((a, b) => (a.voice_library > b.voice_library && 1) || -1);
  }
};
/**
 * Home/SpeakerSetting
 * 話者を変更する
 * @param {string} address voiceroid_daemonのアドレス
 * @param {number} port voiceroid_daemonのポート
 * @param {string} voice_library ボイスライブラリ
 */
const change_speaker = async (address, port, voice_library) =>
  got.post(`${address}:${port}/api/set/speaker`, {
    method: "POST",
    json: { voiceDbName: voice_library, speakerName: voice_library },
  });

/**
 * /api/converttext
 * 文章をVOICEROIDの読み仮名に変換する
 * @param {string} address voiceroid_daemonのアドレス
 * @param {number} port voiceroid_daemonのポート
 * @param {json} parameter_data スピーチパラメータ
 */
const convert_sentence_into_kana = (address, port, parameter_data) =>
  got.post(`${address}:${port}/api/converttext`, {
    method: "POST",
    json: parameter_data,
  });

/**
 * /api/speechtext
 * 文章の音声データ(wav)を返す
 * @param {string} address voiceroid_daemonのアドレス
 * @param {number} port voiceroid_daemonのポート
 * @param {json} parameter_data スピーチパラメータ
 */
const convert_sentence_into_voice = (address, port, parameter_data) => {
  parameter_data.Text = `${parameter_data.Text}。。`;
  return got.stream(`${address}:${port}/api/speechtext`, {
    method: "POST",
    json: parameter_data,
  });
};

/**
 * /api/speechtext
 * 話者を変更して文章の音声データ(wav)を返す
 * @param {string} address voiceroid_daemonのアドレス
 * @param {number} port voiceroid_daemonのポート
 * @param {json} parameter_data スピーチパラメータ
 */
const speaker_change_sentence_voice_converting = async (
  address,
  port,
  voice_library,
  parameter_data
) => {
  const url = `${address}:${port}/api/speechtext`;
  await change_speaker(address, port, voice_library);
  return got.stream(url, {
    method: "POST",
    json: parameter_data,
  });
};

/**
 * 認証コードのシード値を取得します。(ホストのマシンでVOICEROID2を起動した状態で実行してください。)
 * @param {string} address
 * @param {number} port
 */
const get_authorization_code_seed_value = async (address, port) => {
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
const get_system_setting = async (address, port) => {
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
 * { location: "" , content: "" }
 * @param {string} address
 * @param {number} port
 * @param {json} config_json
 */
const set_system_setting = async (address, port, config_json) => {
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
    .html()
    .split(/\n/)
    .filter((value) => /var result =/.test(value))[0]
    .replace(/.+=\s'/, "")
    .replace(/'.+/, "");
  if (/エラー/.test(return_result)) throw new Error(return_result);
  else return return_result;
};

const romanto = (original) => {
  const tree = {
    a: "あ",
    i: "い",
    u: "う",
    e: "え",
    o: "お",
    k: {
      a: "か",
      i: "き",
      u: "く",
      e: "け",
      o: "こ",
      y: { a: "きゃ", i: "きぃ", u: "きゅ", e: "きぇ", o: "きょ" },
    },
    s: {
      a: "さ",
      i: "し",
      u: "す",
      e: "せ",
      o: "そ",
      h: { a: "しゃ", i: "し", u: "しゅ", e: "しぇ", o: "しょ" },
      y: { a: "きゃ", i: "きぃ", u: "きゅ", e: "きぇ", o: "きょ" },
    },
    t: {
      a: "た",
      i: "ち",
      u: "つ",
      e: "て",
      o: "と",
      h: { a: "てゃ", i: "てぃ", u: "てゅ", e: "てぇ", o: "てょ" },
      y: { a: "ちゃ", i: "ちぃ", u: "ちゅ", e: "ちぇ", o: "ちょ" },
      s: { a: "つぁ", i: "つぃ", u: "つ", e: "つぇ", o: "つぉ" },
    },
    c: {
      a: "か",
      i: "し",
      u: "く",
      e: "せ",
      o: "こ",
      h: { a: "ちゃ", i: "ち", u: "ちゅ", e: "ちぇ", o: "ちょ" },
      y: { a: "ちゃ", i: "ちぃ", u: "ちゅ", e: "ちぇ", o: "ちょ" },
    },
    q: {
      a: "くぁ",
      i: "くぃ",
      u: "く",
      e: "くぇ",
      o: "くぉ",
    },
    n: {
      a: "な",
      i: "に",
      u: "ぬ",
      e: "ね",
      o: "の",
      n: "ん",
      y: { a: "にゃ", i: "にぃ", u: "にゅ", e: "にぇ", o: "にょ" },
    },
    h: {
      a: "は",
      i: "ひ",
      u: "ふ",
      e: "へ",
      o: "ほ",
      y: { a: "ひゃ", i: "ひぃ", u: "ひゅ", e: "ひぇ", o: "ひょ" },
    },
    f: {
      a: "ふぁ",
      i: "ふぃ",
      u: "ふ",
      e: "ふぇ",
      o: "ふぉ",
      y: { a: "ふゃ", u: "ふゅ", o: "ふょ" },
    },
    m: {
      a: "ま",
      i: "み",
      u: "む",
      e: "め",
      o: "も",
      y: { a: "みゃ", i: "みぃ", u: "みゅ", e: "みぇ", o: "みょ" },
    },
    y: { a: "や", i: "い", u: "ゆ", e: "いぇ", o: "よ" },
    r: {
      a: "ら",
      i: "り",
      u: "る",
      e: "れ",
      o: "ろ",
      y: { a: "りゃ", i: "りぃ", u: "りゅ", e: "りぇ", o: "りょ" },
    },
    w: { a: "わ", i: "うぃ", u: "う", e: "うぇ", o: "を" },
    g: {
      a: "が",
      i: "ぎ",
      u: "ぐ",
      e: "げ",
      o: "ご",
      y: { a: "ぎゃ", i: "ぎぃ", u: "ぎゅ", e: "ぎぇ", o: "ぎょ" },
    },
    z: {
      a: "ざ",
      i: "じ",
      u: "ず",
      e: "ぜ",
      o: "ぞ",
      y: { a: "じゃ", i: "じぃ", u: "じゅ", e: "じぇ", o: "じょ" },
    },
    j: {
      a: "じゃ",
      i: "じ",
      u: "じゅ",
      e: "じぇ",
      o: "じょ",
      y: { a: "じゃ", i: "じぃ", u: "じゅ", e: "じぇ", o: "じょ" },
    },
    d: {
      a: "だ",
      i: "ぢ",
      u: "づ",
      e: "で",
      o: "ど",
      h: { a: "でゃ", i: "でぃ", u: "でゅ", e: "でぇ", o: "でょ" },
      y: { a: "ぢゃ", i: "ぢぃ", u: "ぢゅ", e: "ぢぇ", o: "ぢょ" },
    },
    b: {
      a: "ば",
      i: "び",
      u: "ぶ",
      e: "べ",
      o: "ぼ",
      y: { a: "びゃ", i: "びぃ", u: "びゅ", e: "びぇ", o: "びょ" },
    },
    v: {
      a: "う゛ぁ",
      i: "う゛ぃ",
      u: "う゛",
      e: "う゛ぇ",
      o: "う゛ぉ",
      y: { a: "う゛ゃ", i: "う゛ぃ", u: "う゛ゅ", e: "う゛ぇ", o: "う゛ょ" },
    },
    p: {
      a: "ぱ",
      i: "ぴ",
      u: "ぷ",
      e: "ぺ",
      o: "ぽ",
      y: { a: "ぴゃ", i: "ぴぃ", u: "ぴゅ", e: "ぴぇ", o: "ぴょ" },
    },
    x: {
      a: "ぁ",
      i: "ぃ",
      u: "ぅ",
      e: "ぇ",
      o: "ぉ",
      y: {
        a: "ゃ",
        i: "ぃ",
        u: "ゅ",
        e: "ぇ",
        o: "ょ",
      },
      t: {
        u: "っ",
        s: {
          u: "っ",
        },
      },
    },
    l: {
      a: "ぁ",
      i: "ぃ",
      u: "ぅ",
      e: "ぇ",
      o: "ぉ",
      y: {
        a: "ゃ",
        i: "ぃ",
        u: "ゅ",
        e: "ぇ",
        o: "ょ",
      },
      t: {
        u: "っ",
        s: {
          u: "っ",
        },
      },
    },
  };
  const str = original
    .replace(/[Ａ-Ｚａ-ｚ]/, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 65248)
    )
    .toLowerCase(); // 全角→半角→小文字
  let result = "";
  let tmp = "";
  let index = 0;
  const len = str.length;
  let node = tree;
  const push = (char, toRoot = true) => {
    result += char;
    tmp = "";
    node = toRoot ? tree : node;
  };
  while (index < len) {
    const char = str.charAt(index);
    if (char.match(/[a-z]/)) {
      // 英数字以外は考慮しない
      if (char in node) {
        const next = node[char];
        if (typeof next === "string") {
          push(next);
        } else {
          tmp += original.charAt(index);
          node = next;
        }
        index++;
        continue;
      }
      const prev = str.charAt(index - 1);
      if (prev && (prev === "n" || prev === char)) {
        // 促音やnへの対応
        push(prev === "n" ? "ん" : "っ", false);
      }
      if (node !== tree && char in tree) {
        // 今のノードがルート以外だった場合、仕切り直してチェックする
        push(tmp);
        continue;
      }
    }
    push(tmp + char);
    index++;
  }
  tmp = tmp.replace(/n$/, "ん"); // 末尾のnは変換する
  push(tmp);
  return result;
};

module.exports = {
  returns_list_available_speaker,
  change_speaker,
  convert_sentence_into_voice,
  convert_sentence_into_kana,
  speaker_change_sentence_voice_converting,
  get_authorization_code_seed_value,
  get_system_setting,
  set_system_setting,
};
