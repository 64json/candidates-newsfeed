import Cookies from 'cookies-js';
import request from 'browser-request';

export const shuffle = (array) => {
  const randomized = [];
  for (let i = array.length - 1; i >= 0; i--) {
    randomized.push(...array.splice(Math.random() * i | 0, 1));
  }
  return randomized;
};

export const stripTags = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  const imgs = div.getElementsByTagName('img');
  const image = imgs[0] && imgs[0].src;
  const summary = (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
  return { image, summary };
};

const mediaKey = 'media';
export const loadMedia = () => {
  const raw = Cookies.get(mediaKey);
  return raw && JSON.parse(raw);
};
export const saveMedia = (media) => {
  Cookies.set(mediaKey, JSON.stringify(media), { expires: Infinity });
};
export const resetMedia = (media) => {
  Cookies.expire(mediaKey);
};

const settingKey = 'setting';
export const loadSetting = () => {
  const raw = Cookies.get(settingKey);
  return raw && JSON.parse(raw);
};
export const saveSetting = (setting) => {
  Cookies.set(settingKey, JSON.stringify(setting), { expires: Infinity });
};

export const getResultMessage = (selectedArticles, candidates, selected, condition) => {
  const { operator, only } = condition;
  const and = operator === 'and';
  const selectedCount = selected.filter(v => v).length;
  const candidateCount = candidates.length;
  const articleCount = selectedArticles.length;

  if (selectedCount === 0) return '후보를 선택해주세요.';

  let resultMessage = `선택된 ${selectedCount}명`;
  if (selectedCount === 1) {
    resultMessage += '의 후보';
    if (only) {
      resultMessage += '만을';
    } else {
      resultMessage += '를';
    }
    resultMessage += ' 다루는';
  } else {
    resultMessage += and ? '의 후보 모두를 ' : ' 중 한명 이상의 후보를 ';
    if (only && selectedCount < candidateCount) {
      resultMessage += '다루고 이외의 후보는 다루지 않는';
    } else {
      resultMessage += '다루는';
    }
  }
  resultMessage += ` 기사 (${articleCount}건)`;
  return resultMessage;
};

export const fetchRSS = (url, cb) => {
  const query = `SELECT * FROM xml WHERE url = '${url}'`;
  request({
    url: `https://query.yahooapis.com/v1/public/yql?q=${encodeURI(query)}&format=json&alltableswithkeys`,
    json: true
  }, (err, res, body) => {
    if (err) return cb(err);
    cb(err, body.query.results.rss.channel.item);
  });
};