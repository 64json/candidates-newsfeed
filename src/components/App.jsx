import React from 'react';
import async from 'async';
import moment from 'moment';
import '../stylesheet.sass';
import candidates from '../data/candidates';
import defaultMedia from '../data/media';
import {
  stripTags,
  loadMedia,
  saveMedia,
  resetMedia,
  getResultMessage,
  loadSetting,
  saveSetting,
  fetchRSS
} from '../utils.js';
import Article from './Article.jsx';
import Candidate from './Candidate.jsx';
import Countdown from './Countdown.jsx';

class App extends React.Component {
  constructor(props) {
    super(props);

    const setting = {
      suffixes: [],
      condition: {
        operator: 'or',
        only: false
      },
      ...loadSetting()
    };

    this.state = {
      selected: candidates.map(({ suffix }) => setting.suffixes.includes(suffix)),
      condition: setting.condition,
      articles: [],
      setup: false,
      media: loadMedia() || defaultMedia,
      new_medium: {
        name: '',
        url: ''
      },
      progress: {
        current: 0,
        total: 1
      }
    };

    this.handleSelectCandidate = this.handleSelectCandidate.bind(this);
    this.filter = this.filter.bind(this);
    this.fetchOne = this.fetchOne.bind(this);
    this.handleChangeCondition = this.handleChangeCondition.bind(this);
    this.handleChangeNewMedium = this.handleChangeNewMedium.bind(this);
    this.handleResetMedia = this.handleResetMedia.bind(this);
  }

  componentDidMount() {
    this.fetch();

    const header = document.getElementById('header');
    const shadow = document.getElementById('shadow');
    const articles = document.getElementById('articles');
    articles.addEventListener('scroll', function (e) {
      const amount = Math.min(articles.scrollTop, header.clientHeight + shadow.clientHeight);
      header.style['margin-top'] = (-amount) + 'px';
      articles.style['padding-top'] = amount + 'px';
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const { selected, condition, media } = this.state;
    const saveRequired = selected !== prevState.selected || condition !== prevState.condition;
    if (saveRequired || media !== prevState.media) {
      document.getElementById('articles').scrollTop = 0;
    }
    if (saveRequired) {
      const suffixes = selected.map((v, i) => v && candidates[i].suffix).filter(v => v);
      saveSetting({ suffixes, condition });
    }
  }

  resetProgress(total = 0) {
    document.getElementById('progress').style.width = total ? '0%' : '100%';
    document.getElementById('progress').style.opacity = total ? '1' : '0';
    this.setState({ progress: { current: 0, total } });
  }

  progress() {
    this.setState((prevState) => {
      const progress = { ...prevState.progress };
      progress.current++;
      const percent = progress.current / progress.total;
      document.getElementById('progress').style.width = `${percent * 100}%`;
      return { progress };
    });
  }

  fetch(media = this.state.media) {
    this.resetProgress(media.length);
    async.each(media,
      (medium, cb) => {
        this.fetchOne(medium, () => {
          this.progress();
          cb(null);
        })
      }, () => {
        this.resetProgress()
      }
    );
  }

  fetchOne({ name, url }, cb) {
    const allKeywords = [];
    candidates.forEach(({ keywords }) => allKeywords.push(...keywords));

    fetchRSS(url, (err, entries) => {
      if (err) return cb(err);

      const media_title = name;

      this.setState((prevState) => {
        const articles = [...prevState.articles];
        articles.push(...entries.map((article) => {
          let { author, link, encoded, description, title, pubDate, date, thumbnail, content } = article;

          let { summary, image } = stripTags(encoded || description);
          image = image || (thumbnail && thumbnail.url) || (content && content.url);
          pubDate = moment(pubDate || date, [
            moment.ISO_8601,
            'ddd, DD MMM YYYY HH:mm:ss ZZ',
            'YYYY.MM.DD',
          ]);

          if (!this.testKeywords(title, summary, allKeywords)) return null;

          return {
            media_title,
            author,
            link,
            summary,
            image,
            title,
            pubDate
          };
        }).filter(v => v));
        return { articles: articles.sort((a, b) => a.pubDate.isBefore(b.pubDate) ? 1 : -1) };
      });

      cb(null);
    });
  }

  testKeywords(title, summary, keywords) {
    return keywords.some((keyword) => ~title.indexOf(keyword) || ~summary.indexOf(keyword));
  }

  filter({ title, summary }) {
    const selectedKeywordsList = this.state.selected.map((v, i) => {
      return v && candidates[i].keywords;
    }).filter(v => v);
    if (!selectedKeywordsList.length) return false;
    const method = { and: 'every', or: 'some' }[this.state.condition.operator];
    const isSelectedIncluded = selectedKeywordsList[method](this.testKeywords.bind(null, title, summary));

    let isOthersIncluded = false;
    if (this.state.condition.only) {
      const bannedKeywordsList = this.state.selected.map((v, i) => {
        return !v && candidates[i].keywords;
      }).filter(v => v);
      isOthersIncluded = bannedKeywordsList.some(this.testKeywords.bind(null, title, summary));
    }

    return isSelectedIncluded && !isOthersIncluded;
  }

  handleSelectCandidate({ target }) {
    const { name, checked } = target;
    const i = name.split('_')[1];
    this.toggleCandidate(i, checked);
  }

  toggleCandidate(i, checked) {
    this.setState((prevState) => {
      const selected = [...prevState.selected];
      selected[i] = checked;
      return { selected };
    });
  }

  handleChangeNewMedium({ target }) {
    const { name, value } = target;
    this.setState((prevState) => ({
      new_medium: {
        ...prevState.new_medium,
        [name]: value
      }
    }));
  }

  handleChangeCondition({ target }) {
    const { name, value } = target;
    this.setState((prevState) => ({
      condition: {
        ...prevState.condition,
        [name]: value
      }
    }));
  }

  handleAddMedium() {
    this.setState((prevState) => {
      const media = [...prevState.media];
      const { name, url } = prevState.new_medium;
      if (!name || !url) return {};
      media.unshift({ name, url });
      this.fetch([media[0]]);
      saveMedia(media);
      return { media, new_medium: { name: '', url: '' } };
    });
  }

  handleRemoveMedium(i) {
    this.setState((prevState) => {
      const media = [...prevState.media];
      const [{ name }] = media.splice(i, 1);
      const articles = prevState.articles.filter(({ media_title }) => media_title !== name);
      saveMedia(media);
      return { media, articles };
    });
  }

  handleResetMedia() {
    resetMedia();
    this.setState({ media: defaultMedia, articles: [] });
    this.fetch(defaultMedia);
  }

  render() {
    const selectedArticles = this.state.articles.filter(this.filter);
    const resultMessage = getResultMessage(selectedArticles, candidates, this.state.selected, this.state.condition);

    return <div className="container">
      <div id="header">
        <div className="bluehouse" />
        <span className="title-tertiary"><span>대한민국</span></span>
        <span className="title-secondary">제19대 대통령 선거</span>
        <span className="title-primary">후보 뉴스피드</span>
      </div>

      <div id="shadow">
        <a className="copyright" href="https://www.youtube.com/watch?v=rJ1INwFKQGU" target="_blank">사진 - SBS대선토론 발췌</a>
        <input type="checkbox" className="toggle-option" name="setup" id="setup"
               checked={this.state.setup}
               onChange={({ target }) => this.setState({ setup: target.checked })} />
        <label htmlFor="setup" className="option">언론사 설정</label>
      </div>

      <div className={`media-container ${this.state.setup ? '' : 'hidden'}`}>
        <div className="button" onClick={this.handleResetMedia}>
          <span>초기화</span>
        </div>
        <div className="media">
          <input type="text" className="name" placeholder="언론사" value={this.state.new_medium.name}
                 name="name" onChange={this.handleChangeNewMedium} />
          <input type="text" className="url" placeholder="RSS 주소" value={this.state.new_medium.url}
                 name="url" onChange={this.handleChangeNewMedium} />
          <span className="action-add" onClick={() => this.handleAddMedium()} />
        </div>
        {
          this.state.media.map(({ name, url }, i) =>
            <div className="media" key={i}>
              <span className="name">{name}</span>
              <span className="url">{url}</span>
              <span className="action-remove" onClick={() => this.handleRemoveMedium(i)} />
            </div>
          )
        }
      </div>

      <div className={`content ${this.state.setup ? 'hidden' : ''}`}>
        <div className="side-container">
          <div className="option-container">
            <input type="radio" className="toggle-option" name="operator" value="and" id="cond_and"
                   checked={this.state.condition.operator === 'and'}
                   onChange={this.handleChangeCondition} />
            <label htmlFor="cond_and" className="option">AND</label>

            <input type="radio" className="toggle-option" name="operator" value="or" id="cond_or"
                   checked={this.state.condition.operator === 'or'}
                   onChange={this.handleChangeCondition} />
            <label htmlFor="cond_or" className="option">OR</label>

            <input type="checkbox" className="toggle-option" id="cond_only"
                   checked={this.state.condition.only}
                   onChange={({ target }) => this.handleChangeCondition({
                     target: { name: 'only', value: target.checked }
                   })} />
            <label htmlFor="cond_only" className="option">ONLY</label>
          </div>
          <div className="candidate-container">
            {
              candidates.map((candidate, i) =>
                <Candidate {...candidate} key={i} handleChange={this.handleSelectCandidate}
                           checked={this.state.selected[i]} {...{ i }} />
              )
            }
          </div>
        </div>
        <div className="main-container">
          <div className="bar-container">
            {
              candidates.map(({ suffix, name }, i) =>
                <div className={`bar bar-${suffix} ${this.state.selected[i] ? 'bar-selected' : ''}`} key={i}
                     onClick={() => this.toggleCandidate(i, false)}>
                  {name}
                </div>
              )
            }
          </div>
          <div className="article-container" id="articles">
            <div className="result-message">
              {resultMessage}
            </div>
            {
              selectedArticles.length ?
                selectedArticles.map((article, i) =>
                  <Article {...article} key={i} />
                ) :
                <Countdown progress={this.state.progress} />
            }
          </div>
        </div>
      </div>
    </div>;
  }
}

export default App;